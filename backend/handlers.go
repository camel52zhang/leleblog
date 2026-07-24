package main

import (
	"fmt"
	"net/http"
	"os"
	"path/filepath"
	"strconv"
	"strings"
	"time"

	"github.com/gin-gonic/gin"
	"golang.org/x/crypto/bcrypt"
	"gorm.io/gorm"
)

// ==================== 0. 健康检查接口 ====================

// healthHandler 供容器探针 / 负载均衡探活使用
func healthHandler(c *gin.Context) {
	status := "ok"
	// 探活时顺带检查数据库连接是否可用
	if sqlDB, err := db.DB(); err != nil || sqlDB.Ping() != nil {
		status = "db_unavailable"
		c.JSON(http.StatusServiceUnavailable, gin.H{"status": status})
		return
	}
	c.JSON(http.StatusOK, gin.H{"status": status})
}

// ==================== 1. 登录接口 ====================

func loginHandler(c *gin.Context) {
	var loginReq struct {
		Username string `json:"username"`
		Password string `json:"password"`
	}
	if err := c.BindJSON(&loginReq); err != nil {
		c.JSON(400, gin.H{"error": "参数解析失败"})
		return
	}

	var user User
	if err := db.Where("username = ?", loginReq.Username).First(&user).Error; err != nil {
		c.JSON(http.StatusUnauthorized, gin.H{"error": "用户名或密码错误"})
		return
	}

	if err := bcrypt.CompareHashAndPassword([]byte(user.PasswordHash), []byte(loginReq.Password)); err != nil {
		c.JSON(http.StatusUnauthorized, gin.H{"error": "用户名或密码错误"})
		return
	}

	token, err := generateToken(user.Username)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "令牌生成失败"})
		return
	}

	c.JSON(http.StatusOK, gin.H{
		"message":              "登录成功",
		"token":                token,
		"must_change_password": user.MustChangePwd,
	})
}

// ==================== 2. 密码重置接口 ====================

func forgotPasswordHandler(c *gin.Context) {
	var req struct {
		Email string `json:"email"`
	}
	if err := c.BindJSON(&req); err != nil {
		c.JSON(400, gin.H{"error": "参数解析失败"})
		return
	}
	if req.Email == "" {
		c.JSON(400, gin.H{"error": "请输入邮箱"})
		return
	}

	var user User
	if err := db.Where("email = ?", req.Email).First(&user).Error; err != nil {
		// 不暴露邮箱是否存在，统一返回成功提示
		c.JSON(200, gin.H{"message": "如果该邮箱已注册，您将收到重置验证码"})
		return
	}

	code := generateResetCode()
	user.ResetCode = code
	user.ResetExpires = time.Now().Add(15 * time.Minute).Unix()
	db.Save(&user)

	if smtpConfigured() {
		if err := sendResetEmail(user.Email, code); err != nil {
			// 发信失败：打印日志兜底，验证码已存库，用户可重试获取
			fmt.Printf("[密码重置] 向 %s 发送验证码邮件失败 (用户 %s): %v\n", user.Email, user.Username, err)
		} else {
			fmt.Printf("[密码重置] 已向 %s 发送验证码邮件 (用户 %s)\n", user.Email, user.Username)
		}
	} else {
		// 未配置 SMTP：本地开发兜底，仅打印到后端日志
		fmt.Printf("[密码重置] 用户 %s 的验证码: %s (有效期15分钟)\n", user.Username, code)
	}

	c.JSON(200, gin.H{"message": "如果该邮箱已注册，您将收到重置验证码"})
}

func resetPasswordHandler(c *gin.Context) {
	var req struct {
		Email       string `json:"email"`
		Code        string `json:"code"`
		NewPassword string `json:"new_password"`
	}
	if err := c.BindJSON(&req); err != nil {
		c.JSON(400, gin.H{"error": "参数解析失败"})
		return
	}
	if req.Email == "" || req.Code == "" || req.NewPassword == "" {
		c.JSON(400, gin.H{"error": "邮箱、验证码和新密码不能为空"})
		return
	}
	if len(req.NewPassword) < 6 {
		c.JSON(400, gin.H{"error": "新密码长度不能少于6位"})
		return
	}

	var user User
	if err := db.Where("email = ?", req.Email).First(&user).Error; err != nil {
		c.JSON(400, gin.H{"error": "邮箱或验证码错误"})
		return
	}

	if user.ResetCode == "" || user.ResetExpires < time.Now().Unix() {
		c.JSON(400, gin.H{"error": "验证码已过期，请重新获取"})
		return
	}

	if user.ResetCode != req.Code {
		c.JSON(400, gin.H{"error": "验证码错误"})
		return
	}

	hashedPwd, err := bcrypt.GenerateFromPassword([]byte(req.NewPassword), bcrypt.DefaultCost)
	if err != nil {
		c.JSON(500, gin.H{"error": "密码加密失败"})
		return
	}

	user.PasswordHash = string(hashedPwd)
	user.ResetCode = ""
	user.ResetExpires = 0
	user.MustChangePwd = false
	db.Save(&user)

	fmt.Printf("[密码重置] 用户 %s 密码已成功重置\n", user.Username)
	c.JSON(200, gin.H{"message": "密码重置成功，请使用新密码登录"})
}

// ==================== 3. 公共展示接口 ====================

func configHandler(c *gin.Context) {
	var config Config
	if err := db.First(&config, 1).Error; err != nil {
		c.JSON(200, Config{SiteName: "沐沐言的博客"})
		return
	}
	c.JSON(200, config)
}

func postsHandler(c *gin.Context) {
	page, _ := strconv.Atoi(c.DefaultQuery("page", "1"))
	pageSize, _ := strconv.Atoi(c.DefaultQuery("pageSize", "10"))
	if page < 1 {
		page = 1
	}
	if pageSize < 1 || pageSize > 100 {
		pageSize = 10
	}
	offset := (page - 1) * pageSize
	query := c.Query("q")
	category := c.Query("category")
	tag := c.Query("tag")

	var posts []Post
	var total int64
	tx := db.Model(&Post{})
	if category != "" {
		tx = tx.Where("category = ?", category)
	}
	if tag != "" {
		tx = tx.Where("id IN (SELECT post_id FROM post_tags JOIN tags ON tags.id = post_tags.tag_id WHERE tags.name = ?)", tag)
	}
	if query != "" {
		tx = tx.Where("title LIKE ? OR content LIKE ?", "%"+query+"%", "%"+query+"%")
	}
	tx.Count(&total)
	tx.Preload("Tags").Order("id desc").Limit(pageSize).Offset(offset).Find(&posts)
	c.JSON(http.StatusOK, gin.H{"list": posts, "total": total, "page": page, "pageSize": pageSize})
}

func postDetailHandler(c *gin.Context) {
	idStr := c.Param("id")
	id, err := strconv.Atoi(idStr)
	if err != nil {
		c.JSON(400, gin.H{"error": "ID格式错误"})
		return
	}
	var post Post
	if err := db.Preload("Tags").Preload("Comments", func(db *gorm.DB) *gorm.DB {
		return db.Order("id desc")
	}).First(&post, id).Error; err != nil {
		c.JSON(http.StatusNotFound, gin.H{"error": "文章不存在"})
		return
	}
	var prev, next Post
	db.Select("id, title").Where("id < ?", id).Order("id desc").First(&prev)
	db.Select("id, title").Where("id > ?", id).Order("id asc").First(&next)
	db.Model(&post).UpdateColumn("views", gorm.Expr("views + ?", 1))
	c.JSON(http.StatusOK, gin.H{
		"post": post,
		"prev": gin.H{"id": prev.ID, "title": prev.Title},
		"next": gin.H{"id": next.ID, "title": next.Title},
	})
}

func addCommentHandler(c *gin.Context) {
	idStr := c.Param("id")
	postID, _ := strconv.Atoi(idStr)
	var comment Comment
	if err := c.BindJSON(&comment); err != nil {
		c.JSON(400, gin.H{"error": "格式错误"})
		return
	}
	comment.Nickname = strings.TrimSpace(comment.Nickname)
	comment.Content = strings.TrimSpace(comment.Content)
	if comment.Nickname == "" || comment.Content == "" {
		c.JSON(400, gin.H{"error": "昵称和内容不能为空"})
		return
	}
	if len(comment.Nickname) > 50 {
		comment.Nickname = comment.Nickname[:50]
	}
	if len(comment.Content) > 5000 {
		c.JSON(400, gin.H{"error": "评论内容不能超过5000字"})
		return
	}
	comment.Content = sanitizeText(comment.Content)
	comment.Nickname = sanitizeText(comment.Nickname)
	comment.PostID = uint(postID)
	comment.IsAdmin = false
	db.Create(&comment)
	c.JSON(200, comment)
}

func categoriesHandler(c *gin.Context) {
	var res []struct {
		Category string `json:"category"`
		Count    int64  `json:"count"`
	}
	db.Model(&Post{}).Select("category, count(*) as count").Group("category").Scan(&res)
	c.JSON(http.StatusOK, res)
}

func tagsSummaryHandler(c *gin.Context) {
	var summaries []struct {
		Name  string `json:"name"`
		Count int64  `json:"count"`
	}
	db.Table("tags").Select("tags.name, count(post_tags.tag_id) as count").
		Joins("left join post_tags on post_tags.tag_id = tags.id").
		Group("tags.name").Scan(&summaries)
	c.JSON(http.StatusOK, summaries)
}

// ==================== 4. 管理端接口 ====================

func adminCommentsHandler(c *gin.Context) {
	page, _ := strconv.Atoi(c.DefaultQuery("page", "1"))
	pageSize, _ := strconv.Atoi(c.DefaultQuery("pageSize", "20"))
	if page < 1 {
		page = 1
	}
	if pageSize < 1 || pageSize > 200 {
		pageSize = 20
	}
	offset := (page - 1) * pageSize

	type CommentWithPost struct {
		Comment
		PostTitle string `json:"post_title"`
	}
	var result []CommentWithPost
	var total int64
	db.Model(&Comment{}).Count(&total)
	db.Table("comments").
		Select("comments.*, posts.title as post_title").
		Joins("left join posts on posts.id = comments.post_id").
		Order("comments.id desc").
		Limit(pageSize).Offset(offset).
		Scan(&result)
	c.JSON(200, gin.H{"list": result, "total": total, "page": page, "pageSize": pageSize})
}

func adminDeleteCommentHandler(c *gin.Context) {
	idStr := c.Param("id")
	id, err := strconv.Atoi(idStr)
	if err != nil {
		c.JSON(400, gin.H{"error": "ID格式错误"})
		return
	}
	db.Delete(&Comment{}, id)
	c.JSON(200, gin.H{"message": "已删除"})
}

func adminReplyHandler(c *gin.Context) {
	var reply Comment
	if err := c.BindJSON(&reply); err != nil {
		return
	}
	reply.Content = sanitizeText(strings.TrimSpace(reply.Content))
	reply.Nickname = sanitizeText(strings.TrimSpace(reply.Nickname))
	if reply.Content == "" {
		c.JSON(400, gin.H{"error": "回复内容不能为空"})
		return
	}
	reply.IsAdmin = true
	db.Create(&reply)
	c.JSON(200, reply)
}

func adminUploadHandler(c *gin.Context) {
	file, err := c.FormFile("file")
	if err != nil {
		c.JSON(400, gin.H{"error": "文件上传错误"})
		return
	}
	if file.Size > 10*1024*1024 {
		c.JSON(400, gin.H{"error": "文件大小不能超过10MB"})
		return
	}
	ext := strings.ToLower(filepath.Ext(file.Filename))
	if !allowedImageExts[ext] {
		c.JSON(400, gin.H{"error": "仅支持 jpg/png/gif/webp 格式"})
		return
	}
	fileName := fmt.Sprintf("post_%d%s", time.Now().UnixNano(), ext)
	dst := filepath.Join(uploadDir, fileName)
	if err := c.SaveUploadedFile(file, dst); err != nil {
		c.JSON(500, gin.H{"error": "存储失败"})
		return
	}
	os.Chmod(dst, 0644)
	// 返回相对路径，由前端同源加载（Next 已代理 /uploads 到后端），避免 Host 头伪造
	c.JSON(200, gin.H{"url": "/uploads/" + fileName})
}

func adminSettingsGetHandler(c *gin.Context) {
	var config Config
	db.First(&config, 1)
	c.JSON(200, config)
}

func adminSettingsPostHandler(c *gin.Context) {
	var input Config
	if err := c.BindJSON(&input); err != nil {
		c.JSON(400, gin.H{"error": "参数错误"})
		return
	}
	db.Model(&Config{}).Where("id = ?", 1).Updates(map[string]interface{}{
		"site_name":   input.SiteName,
		"description": input.Description,
		"favicon":     input.Favicon,
		"author":      input.Author,
	})
	c.JSON(200, gin.H{"message": "保存成功"})
}

func adminUploadIconHandler(c *gin.Context) {
	file, err := c.FormFile("icon_file")
	if err != nil {
		c.JSON(400, gin.H{"error": "未收到图标文件"})
		return
	}
	if file.Size > 2*1024*1024 {
		c.JSON(400, gin.H{"error": "图标文件不能超过2MB"})
		return
	}
	ext := strings.ToLower(filepath.Ext(file.Filename))
	if !allowedImageExts[ext] {
		c.JSON(400, gin.H{"error": "仅支持 jpg/png/gif/webp 格式"})
		return
	}
	fileName := fmt.Sprintf("favicon_%d%s", time.Now().Unix(), ext)
	dst := filepath.Join(uploadDir, fileName)
	if err := c.SaveUploadedFile(file, dst); err != nil {
		c.JSON(500, gin.H{"error": "上传失败"})
		return
	}
	os.Chmod(dst, 0644)
	var currentConfig Config
	db.First(&currentConfig, 1)
	currentConfig.Favicon = "/uploads/" + fileName
	db.Save(&currentConfig)
	c.JSON(200, gin.H{"url": "/uploads/" + fileName})
}

func adminPostsHandler(c *gin.Context) {
	var input struct {
		ID       uint     `json:"id"`
		Title    string   `json:"title"`
		Content  string   `json:"content"`
		Category string   `json:"category"`
		TagNames []string `json:"tag_names"`
	}
	if err := c.BindJSON(&input); err != nil {
		c.JSON(400, gin.H{"error": "参数错误"})
		return
	}
	var tags []Tag
	for _, name := range input.TagNames {
		var tag Tag
		db.FirstOrCreate(&tag, Tag{Name: name})
		tags = append(tags, tag)
	}
	db.Transaction(func(tx *gorm.DB) error {
		if input.ID > 0 {
			tx.Model(&Post{}).Where("id = ?", input.ID).Updates(map[string]interface{}{
				"title":    input.Title,
				"content":  input.Content,
				"category": input.Category,
			})
			return tx.Model(&Post{ID: input.ID}).Association("Tags").Replace(tags)
		}
		return tx.Create(&Post{Title: input.Title, Content: input.Content, Category: input.Category, Tags: tags}).Error
	})
	c.JSON(200, gin.H{"message": "保存成功"})
}

func adminDeletePostHandler(c *gin.Context) {
	idStr := c.Param("id")
	id, err := strconv.Atoi(idStr)
	if err != nil {
		c.JSON(400, gin.H{"error": "ID格式错误"})
		return
	}
	db.Unscoped().Delete(&Post{}, id)
	c.JSON(200, gin.H{"message": "已删除"})
}

func adminChangePasswordHandler(c *gin.Context) {
	var input struct {
		OldPassword string `json:"old_password"`
		NewPassword string `json:"new_password"`
	}
	if err := c.BindJSON(&input); err != nil {
		c.JSON(400, gin.H{"error": "参数错误"})
		return
	}
	var user User
	db.First(&user, 1)
	if err := bcrypt.CompareHashAndPassword([]byte(user.PasswordHash), []byte(input.OldPassword)); err != nil {
		c.JSON(http.StatusUnauthorized, gin.H{"error": "原密码错误"})
		return
	}
	if len(input.NewPassword) < 6 {
		c.JSON(400, gin.H{"error": "新密码长度不能少于6位"})
		return
	}
	hashedPwd, err := bcrypt.GenerateFromPassword([]byte(input.NewPassword), bcrypt.DefaultCost)
	if err != nil {
		c.JSON(500, gin.H{"error": "密码加密失败"})
		return
	}
	// 用结构体字段名更新，确保映射到正确列（must_change_pwd）；
	// Select 强制更新 MustChangePwd（false 为零值，默认会被 Updates 忽略）
	user.PasswordHash = string(hashedPwd)
	user.MustChangePwd = false
	if err := db.Model(&user).Select("PasswordHash", "MustChangePwd").Updates(user).Error; err != nil {
		c.JSON(500, gin.H{"error": "密码保存失败"})
		return
	}
	c.JSON(200, gin.H{"message": "密码修改成功"})
}

// ==================== admin 个人资料（管理员邮箱） ====================

// adminProfileGetHandler 返回当前管理员账号与邮箱（供安全设置页展示）
func adminProfileGetHandler(c *gin.Context) {
	var user User
	if err := db.First(&user, 1).Error; err != nil {
		c.JSON(404, gin.H{"error": "用户不存在"})
		return
	}
	c.JSON(200, gin.H{"username": user.Username, "email": user.Email})
}

// adminProfilePostHandler 更新当前管理员邮箱（用于找回密码验证）
func adminProfilePostHandler(c *gin.Context) {
	var req struct {
		Email string `json:"email"`
	}
	if err := c.BindJSON(&req); err != nil {
		c.JSON(400, gin.H{"error": "参数错误"})
		return
	}
	req.Email = strings.TrimSpace(req.Email)
	if req.Email != "" && !isValidEmail(req.Email) {
		c.JSON(400, gin.H{"error": "邮箱格式不正确"})
		return
	}
	var user User
	if err := db.First(&user, 1).Error; err != nil {
		c.JSON(404, gin.H{"error": "用户不存在"})
		return
	}
	user.Email = req.Email
	if err := db.Save(&user).Error; err != nil {
		c.JSON(500, gin.H{"error": "邮箱保存失败"})
		return
	}
	c.JSON(200, gin.H{"message": "邮箱已更新", "email": user.Email})
}

// isValidEmail 简单校验邮箱格式（含 @ 且域名含点）
func isValidEmail(email string) bool {
	at := strings.LastIndex(email, "@")
	if at <= 0 || at == len(email)-1 {
		return false
	}
	return strings.Contains(email[at+1:], ".")
}
