package main

import (
	"fmt"
	"net/http"
	"os"
	"os/signal"
	"syscall"
	"time"

	"github.com/gin-gonic/gin"
	"golang.org/x/crypto/bcrypt"
	"golang.org/x/time/rate"
	"gorm.io/driver/sqlite"
	"gorm.io/gorm"
)

// 包级共享状态（拆分多文件后供 handlers / backup 复用）
var (
	db        *gorm.DB
	uploadDir string
)

var allowedImageExts = map[string]bool{
	".jpg": true, ".jpeg": true, ".png": true, ".gif": true, ".webp": true,
}

// sqliteOpen 返回 sqlite 打开配置（CGO 已启用）
func sqliteOpen(dbPath string) gorm.Dialector {
	return sqlite.Open(dbPath)
}

func main() {
	dbPath := os.Getenv("DB_PATH")
	if dbPath == "" {
		dbPath = "leleblog.db"
	}

	uploadDir = os.Getenv("UPLOAD_DIR")
	if uploadDir == "" {
		uploadDir = "./uploads"
	}

	// 连接数据库
	var err error
	db, err = gorm.Open(sqliteOpen(dbPath), &gorm.Config{})
	if err != nil {
		panic("数据库连接失败")
	}

	db.AutoMigrate(&Post{}, &Tag{}, &Config{}, &User{}, &Comment{})

	// 初始化默认设置
	var configCount int64
	db.Model(&Config{}).Count(&configCount)
	if configCount == 0 {
		db.Create(&Config{ID: 1, SiteName: "沐沐言的博客", Description: "一个极简的博客系统", Favicon: "/favicon.ico", Author: "沐沐言"})
	}

	// 初始化管理员：优先使用 ADMIN_PASSWORD 环境变量；缺失则生成随机密码并要求首次改密
	var userCount int64
	db.Model(&User{}).Count(&userCount)
	if userCount == 0 {
		adminPwd := os.Getenv("ADMIN_PASSWORD")
		mustChange := false
		if adminPwd == "" {
			adminPwd = generateRandomPassword()
			mustChange = true
		}
		defaultEmail := os.Getenv("ADMIN_EMAIL")
		if defaultEmail == "" {
			defaultEmail = "admin@leleblog.com"
		}
		hashedPwd, herr := bcrypt.GenerateFromPassword([]byte(adminPwd), bcrypt.DefaultCost)
		if herr == nil {
			db.Create(&User{Username: "admin", PasswordHash: string(hashedPwd), Email: defaultEmail, MustChangePwd: mustChange})
			if mustChange {
				fmt.Printf("=== 安全提示 ===\n")
				fmt.Printf("已创建默认管理员 admin，初始随机密码: %s\n", adminPwd)
				fmt.Printf("请尽快登录后台修改密码（首次登录将强制要求改密）。\n")
				fmt.Printf("也可通过设置 ADMIN_PASSWORD 环境变量指定固定密码。\n")
				fmt.Printf("===============\n")
			} else {
				fmt.Printf("检测到系统无账号，已使用环境变量 ADMIN_PASSWORD 创建默认管理员：admin\n")
			}
		}
	}

	os.MkdirAll(uploadDir, os.ModePerm)

	// 读取 SMTP 配置（可选功能：用于真实发送找回密码验证码）
	loadSMTPConfig()
	if smtpConfigured() {
		fmt.Printf("SMTP 已配置: %s:%d (from=%s, ssl=%v)\n", smtpHost, smtpPort, smtpFrom, smtpUseSSL)
	} else {
		fmt.Println("SMTP 未配置：找回密码验证码将仅打印到后端日志（如需真实发信，请在 .env 配置 SMTP_* 变量）")
	}

	r := gin.Default()
	r.Static("/uploads", uploadDir)

	// 全局中间件：CORS 白名单 + 按 IP 限流
	allowed := loadAllowedOrigins()
	r.Use(corsMiddleware(allowed))
	limiter := newIPLimiter(rate.Every(1*time.Second), 20)
	r.Use(limiter.middleware())

	// 公共接口
	r.GET("/api/health", healthHandler)
	r.POST("/api/login", loginHandler)
	r.POST("/api/forgot-password", forgotPasswordHandler)
	r.POST("/api/reset-password", resetPasswordHandler)
	r.GET("/api/config", configHandler)
	r.GET("/api/posts", postsHandler)
	r.GET("/api/posts/:id", postDetailHandler)
	r.POST("/api/posts/:id/comments", addCommentHandler)
	r.GET("/api/categories", categoriesHandler)
	r.GET("/api/tags/summary", tagsSummaryHandler)

	// 管理端接口（需 JWT 认证）
	admin := r.Group("/api/admin", authMiddleware())
	{
		admin.GET("/comments", adminCommentsHandler)
		admin.DELETE("/comments/:id", adminDeleteCommentHandler)
		admin.POST("/comments/reply", adminReplyHandler)
		admin.POST("/uploads", adminUploadHandler)
		admin.GET("/settings", adminSettingsGetHandler)
		admin.POST("/settings", adminSettingsPostHandler)
		admin.POST("/upload-icon", adminUploadIconHandler)
		admin.GET("/backup/export", func(c *gin.Context) { exportBackup(c, dbPath) })
		admin.POST("/backup/restore", func(c *gin.Context) { restoreBackup(c, dbPath) })
		admin.POST("/posts", adminPostsHandler)
		admin.DELETE("/posts/:id", adminDeletePostHandler)
		admin.POST("/change-password", adminChangePasswordHandler)
		admin.GET("/profile", adminProfileGetHandler)
		admin.POST("/profile", adminProfilePostHandler)
	}

	srv := &http.Server{
		Addr:    ":7070",
		Handler: r,
	}

	// 优雅关闭
	go func() {
		if err := srv.ListenAndServe(); err != nil && err != http.ErrServerClosed {
			panic(err)
		}
	}()
	fmt.Printf("LeleBlog 后端启动成功，监听端口 :7070 (DB: %s, Uploads: %s)\n", dbPath, uploadDir)

	quit := make(chan os.Signal, 1)
	signal.Notify(quit, syscall.SIGINT, syscall.SIGTERM)
	<-quit
	fmt.Println("接收到关闭信号，正在优雅关闭...")

	// 关闭数据库连接
	if sqlDB, derr := db.DB(); derr == nil {
		_ = sqlDB.Close()
	}
}
