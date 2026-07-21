package main

import (
	"bytes"
	"crypto/tls"
	"encoding/base64"
	"fmt"
	"net/smtp"
	"os"
	"strconv"
	"time"
)

// SMTP 配置（启动期从环境变量加载）
var (
	smtpHost     string
	smtpPort     int
	smtpUser     string
	smtpPassword string
	smtpFrom     string
	smtpUseSSL   bool // true=隐式 SSL(465)，false=STARTTLS(587)
)

// smtpConfigured 报告是否已配置可用 SMTP
func smtpConfigured() bool {
	return smtpHost != "" && smtpPort != 0 && smtpFrom != ""
}

// loadSMTPConfig 从环境变量读取 SMTP 配置（可选功能）
// 变量说明：
//   SMTP_HOST       SMTP 服务器地址，如 smtp.qq.com
//   SMTP_PORT       端口，465 配 SMTP_USE_SSL=true，587 配 SMTP_USE_SSL=false
//   SMTP_USER       登录用户名（多数服务商即完整邮箱）
//   SMTP_PASSWORD   授权码/密码（注意：QQ/163 等需用「授权码」而非登录密码）
//   SMTP_FROM       发件人地址，如 no-reply@leleblog.com
//   SMTP_USE_SSL    true=隐式 SSL(465)，false=STARTTLS(587)
func loadSMTPConfig() {
	smtpHost = os.Getenv("SMTP_HOST")
	if p := os.Getenv("SMTP_PORT"); p != "" {
		smtpPort, _ = strconv.Atoi(p)
	}
	smtpUser = os.Getenv("SMTP_USER")
	smtpPassword = os.Getenv("SMTP_PASSWORD")
	smtpFrom = os.Getenv("SMTP_FROM")
	if v := os.Getenv("SMTP_USE_SSL"); v == "1" || v == "true" || v == "yes" || v == "TRUE" {
		smtpUseSSL = true
	}
}

// buildResetMail 组装密码重置验证码邮件（含中文主题，使用 UTF-8 Base64 编码）
func buildResetMail(to, code string) ([]byte, error) {
	subject := "【LeleBlog】密码重置验证码"
	subjectEncoded := "=?UTF-8?B?" + base64.StdEncoding.EncodeToString([]byte(subject)) + "?="

	html := fmt.Sprintf(`<!DOCTYPE html>
<html lang="zh-CN">
<head><meta charset="UTF-8"></head>
<body style="margin:0;padding:24px;background:#f5f5f7;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,sans-serif;">
  <div style="max-width:480px;margin:0 auto;background:#ffffff;border-radius:16px;padding:32px;box-shadow:0 4px 24px rgba(0,0,0,0.06);">
    <h2 style="margin:0 0 16px;color:#111827;font-size:20px;">密码重置验证码</h2>
    <p style="margin:0 0 16px;color:#4b5563;line-height:1.6;font-size:14px;">
      您好，我们收到了您的密码重置请求。请使用以下 6 位验证码（有效期 15 分钟）：
    </p>
    <div style="margin:20px 0;padding:16px 24px;background:#f3f4f6;border-radius:12px;text-align:center;font-size:32px;letter-spacing:8px;font-weight:700;color:#111827;">
      %s
    </div>
    <p style="margin:0 0 8px;color:#6b7280;line-height:1.6;font-size:13px;">
      如果这不是您本人的操作，请忽略此邮件，您的密码不会更改。
    </p>
    <p style="margin:0;color:#9ca3af;font-size:12px;">LeleBlog 团队</p>
  </div>
</body>
</html>`, code)

	var msg bytes.Buffer
	fmt.Fprintf(&msg, "From: %s\r\n", smtpFrom)
	fmt.Fprintf(&msg, "To: %s\r\n", to)
	fmt.Fprintf(&msg, "Subject: %s\r\n", subjectEncoded)
	fmt.Fprintf(&msg, "MIME-Version: 1.0\r\n")
	fmt.Fprintf(&msg, "Content-Type: text/html; charset=UTF-8\r\n")
	fmt.Fprintf(&msg, "Date: %s\r\n", time.Now().Format(time.RFC1123Z))
	fmt.Fprintf(&msg, "\r\n")
	msg.WriteString(html)
	return msg.Bytes(), nil
}

// sendResetEmail 发送密码重置验证码邮件。
// 返回 error 表示发送失败（调用方据此回退到日志等兜底逻辑）。
func sendResetEmail(to, code string) error {
	if !smtpConfigured() {
		return fmt.Errorf("SMTP 未配置")
	}

	msg, err := buildResetMail(to, code)
	if err != nil {
		return err
	}

	addr := fmt.Sprintf("%s:%d", smtpHost, smtpPort)
	var auth smtp.Auth
	if smtpUser != "" {
		auth = smtp.PlainAuth("", smtpUser, smtpPassword, smtpHost)
	}

	if smtpUseSSL {
		// 隐式 SSL（如 465 端口）
		conn, err := tls.Dial("tcp", addr, &tls.Config{ServerName: smtpHost})
		if err != nil {
			return fmt.Errorf("建立 SSL 连接失败: %w", err)
		}
		defer conn.Close()

		client, err := smtp.NewClient(conn, smtpHost)
		if err != nil {
			return fmt.Errorf("创建 SMTP 客户端失败: %w", err)
		}
		defer client.Quit()

		if auth != nil {
			if err := client.Auth(auth); err != nil {
				return fmt.Errorf("SMTP 鉴权失败: %w", err)
			}
		}
		if err := client.Mail(smtpFrom); err != nil {
			return fmt.Errorf("MAIL FROM 失败: %w", err)
		}
		if err := client.Rcpt(to); err != nil {
			return fmt.Errorf("RCPT TO 失败: %w", err)
		}
		w, err := client.Data()
		if err != nil {
			return fmt.Errorf("DATA 失败: %w", err)
		}
		if _, err := w.Write(msg); err != nil {
			return fmt.Errorf("写入邮件内容失败: %w", err)
		}
		if err := w.Close(); err != nil {
			return fmt.Errorf("提交邮件失败: %w", err)
		}
		return nil
	}

	// STARTTLS（如 587 端口）
	if err := smtp.SendMail(addr, auth, smtpFrom, []string{to}, msg); err != nil {
		return fmt.Errorf("发送邮件失败: %w", err)
	}
	return nil
}
