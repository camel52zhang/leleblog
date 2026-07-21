# leleblog 项目长期记忆

全栈博客系统：Next.js 16.1.6 + React 19（App Router, Tailwind v4）前端 / Go + Gin + GORM + SQLite 后端 / docker-compose 编排。

## 关键构建约束（必读）
- **后端用 CGO SQLite（`gorm.io/driver/sqlite`）。本机（Windows）无 gcc，无法本地 `go build`**。任何后端代码验证都必须走 `docker compose build`（镜像内置 gcc/musl-dev/sqlite-dev，CGO_ENABLED=1）。
- 反向验证技巧：临时把驱动换成 API 完全一致的纯 Go 版 `github.com/glebarez/sqlite`（`CGO_ENABLED=0`）做 `go vet`/`go test`，通过后再还原 + 恢复 go.mod/go.sum 备份。不要用纯 Go 驱动做生产构建。
- **`JWT_SECRET` 缺失时后端 `init()` 直接 panic 拒启动**（fail-fast，无硬编码回退）。`go test` 和 CI 测试步必须先 `export JWT_SECRET=xxx`，否则测试 panic 报错。
- 后端已拆为 6 文件（package main）：models.go / middleware.go / utils.go / backup.go / handlers.go / main.go。Dockerfile 构建命令是 `go build -o server .`（整包，不能只编 main.go）。

## 已完成的优化状态（2026-07-20）
- 17 项分析发现全部修复（安全/数据/限流/拆分/前端高亮/强制改密/工程化/.gitignore/.env.example/README/healthcheck/CI）。
- Docker 端到端验收时又发现并修复 2 个真实问题：① compose 漏传 `ADMIN_PASSWORD`；② 改密接口 `Updates(map{"must_change_password":false})` 列名写错（json tag 当列名）且未查 err，导致改密假成功。已改为 `db.Model(&user).Select("PasswordHash","MustChangePwd").Updates(user)`。

## 部署须知
- 复制 `.env.example` 为 `.env`，填入 64 位随机 `JWT_SECRET`；可选设 `ADMIN_PASSWORD`（不设则后端生成随机密码并强制首次改密）。
- 启动：`docker compose up -d --build`。前端 :4000，后端 :7070，`/api/health` 做容器健康检查。
- `ADMIN_PASSWORD` 必须同时出现在 `.env` 与 compose 的 `environment`（`ADMIN_PASSWORD=${ADMIN_PASSWORD}`）才能透传。
