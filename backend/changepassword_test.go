package main

import (
	"encoding/json"
	"net/http"
	"net/http/httptest"
	"os"
	"strings"
	"testing"

	"github.com/gin-gonic/gin"
	"golang.org/x/crypto/bcrypt"
	"gorm.io/gorm"
)

// 该测试守护的是一次真实回归：改密接口曾因把 json tag 名（must_change_password）
// 误当数据库列名，导致整条 UPDATE 失败却未校验错误，表现为「改密成功、新密码却登不进」。
// 这里完整跑通 登录 -> 改密 -> 用新密码登录，确保新密码真实落库、旧密码失效。

// setupChangePwdTestDB 建一个临时 SQLite，播种 id=1 的管理员 admin/OldPass123，
// 并将其挂到包级 db（handler 通过包级 db 读写），返回清理函数。
func setupChangePwdTestDB(t *testing.T) func() {
	t.Helper()
	tmp, err := os.CreateTemp("", "leleblog-cp-test-*.db")
	if err != nil {
		t.Fatalf("创建临时测试库失败: %v", err)
	}
	tmp.Close()

	d, err := gorm.Open(sqliteOpen(tmp.Name()), &gorm.Config{})
	if err != nil {
		os.Remove(tmp.Name())
		t.Fatalf("打开临时测试库失败: %v", err)
	}
	if err := d.AutoMigrate(&User{}); err != nil {
		os.Remove(tmp.Name())
		t.Fatalf("迁移失败: %v", err)
	}
	hashed, err := bcrypt.GenerateFromPassword([]byte("OldPass123"), bcrypt.DefaultCost)
	if err != nil {
		os.Remove(tmp.Name())
		t.Fatalf("bcrypt 失败: %v", err)
	}
	if err := d.Create(&User{Username: "admin", PasswordHash: string(hashed), Email: "admin@leleblog.com", MustChangePwd: false}).Error; err != nil {
		os.Remove(tmp.Name())
		t.Fatalf("播种管理员失败: %v", err)
	}

	// 把包级 db 指向测试库，测试结束还原
	prev := db
	db = d
	return func() {
		db = prev
		os.Remove(tmp.Name())
	}
}

// newChangePwdRouter 复刻生产路由中本测试关心的两条：
// POST /api/login 与 POST /api/admin/change-password（带 JWT 中间件）。
// 刻意不引入 CORS/限流等中间件，聚焦改密链路本身。
func newChangePwdRouter() *gin.Engine {
	gin.SetMode(gin.TestMode)
	r := gin.New()
	r.POST("/api/login", loginHandler)
	admin := r.Group("/api/admin", authMiddleware())
	admin.POST("/change-password", adminChangePasswordHandler)
	return r
}

func TestChangePasswordFlow(t *testing.T) {
	cleanup := setupChangePwdTestDB(t)
	defer cleanup()
	r := newChangePwdRouter()

	// 1) 用旧密码登录，拿到 token
	loginOld := func() (int, string) {
		w := httptest.NewRecorder()
		req := httptest.NewRequest(http.MethodPost, "/api/login", strings.NewReader(`{"username":"admin","password":"OldPass123"}`))
		req.Header.Set("Content-Type", "application/json")
		r.ServeHTTP(w, req)
		var resp struct {
			Token string `json:"token"`
		}
		_ = json.Unmarshal(w.Body.Bytes(), &resp)
		return w.Code, resp.Token
	}
	code, token := loginOld()
	if code != http.StatusOK {
		t.Fatalf("用旧密码登录应成功，实际 HTTP %d", code)
	}
	if token == "" {
		t.Fatal("登录未返回 token")
	}

	// 2) 改密：旧 OldPass123 -> 新 NewPass456
	w := httptest.NewRecorder()
	req := httptest.NewRequest(http.MethodPost, "/api/admin/change-password",
		strings.NewReader(`{"old_password":"OldPass123","new_password":"NewPass456"}`))
	req.Header.Set("Content-Type", "application/json")
	req.Header.Set("Authorization", "Bearer "+token)
	r.ServeHTTP(w, req)
	if w.Code != http.StatusOK {
		t.Fatalf("改密应成功，实际 HTTP %d, body=%s", w.Code, w.Body.String())
	}

	// 3) 关键回归断言：用新密码必须能登录（修复前这里会 401）
	w3 := httptest.NewRecorder()
	req3 := httptest.NewRequest(http.MethodPost, "/api/login", strings.NewReader(`{"username":"admin","password":"NewPass456"}`))
	req3.Header.Set("Content-Type", "application/json")
	r.ServeHTTP(w3, req3)
	if w3.Code != http.StatusOK {
		t.Fatalf("改密后新密码应可登录（回归：修复前此处 401），实际 HTTP %d", w3.Code)
	}

	// 4) 旧密码必须失效
	w4 := httptest.NewRecorder()
	req4 := httptest.NewRequest(http.MethodPost, "/api/login", strings.NewReader(`{"username":"admin","password":"OldPass123"}`))
	req4.Header.Set("Content-Type", "application/json")
	r.ServeHTTP(w4, req4)
	if w4.Code != http.StatusUnauthorized {
		t.Fatalf("改密后旧密码应被拒绝，实际 HTTP %d", w4.Code)
	}

	// 5) 数据库里 MustChangePwd 应被清空（改密接口用 Select 强制更新该零值字段）
	var u User
	if err := db.First(&u, 1).Error; err != nil {
		t.Fatalf("读取管理员失败: %v", err)
	}
	if u.MustChangePwd {
		t.Errorf("改密后 MustChangePwd 应为 false，实际 true")
	}
}
