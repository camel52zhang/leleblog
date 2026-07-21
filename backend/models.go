package main

import (
	"time"

	"gorm.io/gorm"
)

// ==================== 模型定义 ====================

type Post struct {
	ID        uint           `gorm:"primaryKey" json:"id"`
	CreatedAt time.Time      `json:"created_at"`
	UpdatedAt time.Time      `json:"updated_at"`
	DeletedAt gorm.DeletedAt `gorm:"index" json:"-"`
	Title     string         `gorm:"not null" json:"title"`
	Content   string         `json:"content"`
	Category  string         `json:"category"`
	Views     int64          `gorm:"default:0" json:"views"`
	Tags      []Tag          `gorm:"many2many:post_tags;" json:"tags"`
	Comments  []Comment      `json:"comments"`
}

type Tag struct {
	ID   uint   `gorm:"primaryKey" json:"id"`
	Name string `gorm:"uniqueIndex" json:"name"`
}

type Config struct {
	ID          uint   `gorm:"primaryKey" json:"id"`
	SiteName    string `json:"site_name"`
	Description string `json:"description"`
	Favicon     string `json:"favicon"`
	Author      string `json:"author"`
}

type User struct {
	ID              uint   `gorm:"primaryKey" json:"id"`
	Username        string `gorm:"uniqueIndex" json:"username"`
	PasswordHash    string `json:"password_hash"`
	Email           string `json:"email"`
	MustChangePwd   bool   `gorm:"default:false" json:"must_change_password"`
	ResetCode       string `json:"-"`
	ResetExpires    int64  `json:"-"`
}

type Comment struct {
	ID        uint      `gorm:"primaryKey" json:"id"`
	CreatedAt time.Time `json:"created_at"`
	PostID    uint      `json:"post_id" gorm:"index"`
	Nickname  string    `json:"nickname"`
	Content   string    `json:"content"`
	IsAdmin   bool      `json:"is_admin"`
}
