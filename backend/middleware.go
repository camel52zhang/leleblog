package main

import (
	"net/http"
	"os"
	"strings"
	"sync"
	"time"

	"github.com/gin-gonic/gin"
	"github.com/golang-jwt/jwt/v5"
	"golang.org/x/time/rate"
)

// ==================== JWT 配置 ====================

var jwtSecret = []byte(os.Getenv("JWT_SECRET"))

func init() {
	if len(jwtSecret) == 0 {
		// 安全底线：缺失密钥直接失败退出，绝不回退到可预测的明文默认值
		panic("JWT_SECRET 环境变量未设置，拒绝启动。请在 docker-compose.yml / .env 中配置一个足够随机的密钥")
	}
}

type Claims struct {
	Username string `json:"username"`
	jwt.RegisteredClaims
}

func generateToken(username string) (string, error) {
	claims := Claims{
		Username: username,
		RegisteredClaims: jwt.RegisteredClaims{
			ExpiresAt: jwt.NewNumericDate(time.Now().Add(24 * time.Hour)),
			IssuedAt:  jwt.NewNumericDate(time.Now()),
		},
	}
	token := jwt.NewWithClaims(jwt.SigningMethodHS256, claims)
	return token.SignedString(jwtSecret)
}

// ==================== 认证中间件 ====================

func authMiddleware() gin.HandlerFunc {
	return func(c *gin.Context) {
		authHeader := c.GetHeader("Authorization")
		if authHeader == "" {
			c.AbortWithStatusJSON(http.StatusUnauthorized, gin.H{"error": "未提供认证令牌"})
			return
		}

		parts := strings.SplitN(authHeader, " ", 2)
		if len(parts) != 2 || parts[0] != "Bearer" {
			c.AbortWithStatusJSON(http.StatusUnauthorized, gin.H{"error": "认证格式错误"})
			return
		}

		token, err := jwt.ParseWithClaims(parts[1], &Claims{}, func(token *jwt.Token) (interface{}, error) {
			if _, ok := token.Method.(*jwt.SigningMethodHMAC); !ok {
				return nil, jwt.ErrSignatureInvalid
			}
			return jwtSecret, nil
		})
		if err != nil || !token.Valid {
			c.AbortWithStatusJSON(http.StatusUnauthorized, gin.H{"error": "令牌无效或已过期"})
			return
		}

		claims, ok := token.Claims.(*Claims)
		if !ok {
			c.AbortWithStatusJSON(http.StatusUnauthorized, gin.H{"error": "无法解析令牌"})
			return
		}

		c.Set("username", claims.Username)
		c.Next()
	}
}

// ==================== CORS 中间件（来源白名单） ====================

// loadAllowedOrigins 读取 ALLOWED_ORIGINS 环境变量（逗号分隔）。
// 为空时回退到已知的同栈前端来源，避免写死通配符 "*"。
func loadAllowedOrigins() map[string]struct{} {
	raw := os.Getenv("ALLOWED_ORIGINS")
	set := make(map[string]struct{})
	if raw == "" {
		raw = "http://leleblog-web:4000,http://localhost:4000"
	}
	for _, o := range strings.Split(raw, ",") {
		o = strings.TrimSpace(o)
		if o != "" {
			set[o] = struct{}{}
		}
	}
	return set
}

func corsMiddleware(allowed map[string]struct{}) gin.HandlerFunc {
	return func(c *gin.Context) {
		origin := c.GetHeader("Origin")
		if origin != "" {
			if _, ok := allowed[origin]; ok {
				c.Writer.Header().Set("Access-Control-Allow-Origin", origin)
				c.Writer.Header().Set("Access-Control-Allow-Credentials", "true")
			}
		}
		c.Writer.Header().Set("Access-Control-Allow-Methods", "POST, GET, OPTIONS, PUT, DELETE")
		c.Writer.Header().Set("Access-Control-Allow-Headers", "Content-Type, Content-Length, Authorization")
		if c.Request.Method == "OPTIONS" {
			c.AbortWithStatus(204)
			return
		}
		c.Next()
	}
}

// ==================== 速率限制中间件（按客户端 IP） ====================

type ipLimiter struct {
	limiters sync.Map // key: client IP -> *rate.Limiter
	rate     rate.Limit
	burst    int
}

func newIPLimiter(r rate.Limit, burst int) *ipLimiter {
	return &ipLimiter{rate: r, burst: burst}
}

func (l *ipLimiter) get(ip string) *rate.Limiter {
	v, ok := l.limiters.Load(ip)
	if !ok {
		lim := rate.NewLimiter(l.rate, l.burst)
		actual, _ := l.limiters.LoadOrStore(ip, lim)
		return actual.(*rate.Limiter)
	}
	return v.(*rate.Limiter)
}

// clientIP 优先取 X-Forwarded-For 首段（经反向代理时反映真实客户端），
// 否则回退到直接连接的 RemoteAddr。
func clientIP(c *gin.Context) string {
	if xff := c.GetHeader("X-Forwarded-For"); xff != "" {
		if idx := strings.IndexByte(xff, ','); idx > 0 {
			return strings.TrimSpace(xff[:idx])
		}
		return strings.TrimSpace(xff)
	}
	return c.ClientIP()
}

func (l *ipLimiter) middleware() gin.HandlerFunc {
	return func(c *gin.Context) {
		ip := clientIP(c)
		if !l.get(ip).Allow() {
			c.AbortWithStatusJSON(http.StatusTooManyRequests, gin.H{"error": "请求过于频繁，请稍后再试"})
			return
		}
		c.Next()
	}
}
