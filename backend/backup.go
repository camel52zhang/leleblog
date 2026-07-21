package main

import (
	"fmt"
	"net/http"
	"os"
	"path/filepath"
	"time"

	"github.com/gin-gonic/gin"
	"gorm.io/gorm"
)

// siblingTemp 在与 dbPath 同目录生成临时文件。
// 关键：容器内 /tmp 常为独立 tmpfs 挂载，若临时文件落在 /tmp 而 dbPath 在 /app，
// 后续 os.Rename 跨设备会报 EXDEV 失败。同目录可保证同一文件系统，且便于清理。
func siblingTemp(dbPath, prefix string) string {
	dir := filepath.Dir(dbPath)
	return filepath.Join(dir, fmt.Sprintf("%s_%d.db", prefix, time.Now().UnixNano()))
}

// exportBackup 使用 VACUUM INTO 生成一致性数据库快照，避免直接读取正在写入的活库。
func exportBackup(c *gin.Context, dbPath string) {
	tmpFile := siblingTemp(dbPath, "leleblog_backup")
	// 先清理可能残留的临时文件
	os.Remove(tmpFile)

	sqlDB, err := db.DB()
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "数据库句柄获取失败: " + err.Error()})
		return
	}
	// VACUUM INTO 会在 SQLite 侧生成一致性副本
	if _, err := sqlDB.Exec(fmt.Sprintf("VACUUM INTO '%s'", tmpFile)); err != nil {
		os.Remove(tmpFile)
		c.JSON(http.StatusInternalServerError, gin.H{"error": "备份生成失败: " + err.Error()})
		return
	}
	defer os.Remove(tmpFile)

	fileName := filepath.Base(tmpFile)
	c.Writer.Header().Set("Content-Disposition", fmt.Sprintf("attachment; filename=%s", fileName))
	c.Writer.Header().Set("Content-Type", "application/octet-stream")
	c.File(tmpFile)
}

// restoreBackup 安全恢复：先备份当前库，关闭连接，替换文件后重新打开并赋值全局 db。
func restoreBackup(c *gin.Context, dbPath string) {
	file, err := c.FormFile("backup_file")
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "未收到上传文件"})
		return
	}
	if file.Size > 100*1024*1024 {
		c.JSON(http.StatusBadRequest, gin.H{"error": "备份文件不能超过100MB"})
		return
	}

	// 1. 接收上传到 dbPath 同目录的临时文件（避免跨设备 rename）
	tmpFile := siblingTemp(dbPath, "leleblog_restore")
	if err := c.SaveUploadedFile(file, tmpFile); err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "写入临时文件失败: " + err.Error()})
		return
	}
	defer os.Remove(tmpFile)

	// 2. 先对当前库做预备份（便于失败回滚）
	backupCur := siblingTemp(dbPath, "leleblog_pre_restore")
	if err := copyFile(dbPath, backupCur); err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "无法备份当前数据库，已中止恢复: " + err.Error()})
		return
	}
	defer os.Remove(backupCur)

	// 3. 关闭当前数据库连接，避免读写冲突
	if sqlDB, err := db.DB(); err == nil {
		_ = sqlDB.Close()
	}

	// 4. 清理 WAL/SHM 等附属文件，避免与新库冲突
	for _, side := range []string{"-wal", "-shm", "-journal"} {
		os.Remove(dbPath + side)
	}

	// 5. 用拷贝方式覆盖数据库文件（跨设备/文件被映射也安全），而非 rename
	if err := copyFile(tmpFile, dbPath); err != nil {
		// 回滚到预备份，并尽量恢复可用连接，避免 API 彻底瘫痪
		copyFile(backupCur, dbPath)
		reopenDB(dbPath)
		c.JSON(http.StatusInternalServerError, gin.H{"error": "恢复失败：写入数据库文件失败 - " + err.Error()})
		return
	}

	// 6. 重新打开数据库并替换全局句柄
	newDB, err := gorm.Open(sqliteOpen(dbPath), &gorm.Config{})
	if err != nil {
		// 回滚
		copyFile(backupCur, dbPath)
		reopenDB(dbPath)
		c.JSON(http.StatusInternalServerError, gin.H{"error": "恢复失败：重新打开数据库失败 - " + err.Error()})
		return
	}
	db = newDB
	newDB.AutoMigrate(&Post{}, &Tag{}, &Config{}, &User{}, &Comment{})

	c.JSON(http.StatusOK, gin.H{"message": "恢复成功，所有连接已切换到新数据库"})
}

// reopenDB 在恢复失败时尝试把全局 db 重新打开，保证 API 不彻底瘫痪。
func reopenDB(dbPath string) {
	if newDB, err := gorm.Open(sqliteOpen(dbPath), &gorm.Config{}); err == nil {
		db = newDB
	}
}

// copyFile 简单文件拷贝（覆盖写，等价于 truncate + write）。
func copyFile(src, dst string) error {
	data, err := os.ReadFile(src)
	if err != nil {
		return err
	}
	return os.WriteFile(dst, data, 0644)
}
