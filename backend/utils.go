package main

import (
	"crypto/rand"
	"encoding/hex"
	"fmt"
	"strings"
)

// generateResetCode 生成 6 位数字验证码
func generateResetCode() string {
	b := make([]byte, 3)
	rand.Read(b)
	code := int(b[0])%10*100000 + int(b[1])%10*10000 + int(b[2])%10*1000 +
		int(b[0]>>4)%10*100 + int(b[1]>>4)%10*10 + int(b[2]>>4)%10
	return fmt.Sprintf("%06d", code%1000000)
}

// generateResetToken 生成 16 进制随机令牌（备用）
func generateResetToken() string {
	b := make([]byte, 16)
	rand.Read(b)
	return hex.EncodeToString(b)
}

// generateRandomPassword 生成用于初始化管理员的随机密码（仅当未通过环境变量提供时）
func generateRandomPassword() string {
	b := make([]byte, 12)
	rand.Read(b)
	return hex.EncodeToString(b)
}

// sanitizeText 简单的 XSS 防护：替换 HTML 特殊字符
func sanitizeText(s string) string {
	s = strings.ReplaceAll(s, "&", "&amp;")
	s = strings.ReplaceAll(s, "<", "&lt;")
	s = strings.ReplaceAll(s, ">", "&gt;")
	s = strings.ReplaceAll(s, "\"", "&quot;")
	s = strings.ReplaceAll(s, "'", "&#39;")
	return s
}
