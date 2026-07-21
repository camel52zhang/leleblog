# 沐沐言的博客 (leleblog)

一个极简、自托管的个人博客系统，包含 Markdown 写作、代码高亮、评论互动与后台管理。

## 技术栈

- **前端**：Next.js 16 (App Router) + React 19 + Tailwind CSS v4 + TypeScript
- **后端**：Go + Gin + GORM + SQLite (CGO)
- **部署**：Docker Compose（前端 + 后端两个服务）

## 目录结构

```
leleblog/
├── backend/            # Go 后端（package main，多文件拆分）
│   ├── main.go         # 入口：路由装配、优雅关闭、管理员初始化
│   ├── models.go       # GORM 数据模型
│   ├── middleware.go   # JWT 鉴权、CORS 白名单、按 IP 限流
│   ├── handlers.go     # 所有路由处理函数
│   ├── backup.go       # 数据库备份 / 恢复（VACUUM INTO）
│   ├── utils.go        # 随机密码、重置码等工具
│   └── Dockerfile
├── frontend/           # Next.js 前端
│   ├── app/            # 页面与路由
│   └── Dockerfile
├── docker-compose.yml
├── .env.example        # 环境变量模板
└── .gitignore
```

## 快速开始（Docker Compose）

1. 复制环境变量模板并填入强随机密钥：

   ```bash
   cp .env.example .env
   # 编辑 .env，至少设置 JWT_SECRET（openssl rand -hex 32）
   ```

2. 启动：

   ```bash
   docker compose up -d --build
   ```

3. 访问：

   - 前台：`http://localhost:4000`
   - 后台：`http://localhost:4000/admin`

首次启动时若未设置 `ADMIN_PASSWORD`，后端会自动生成随机管理员密码并**强制首次登录改密**，密码会打印在后端容器日志中。

## 本地开发

**后端**（需要本机安装 gcc 以编译 CGO SQLite；或用 Docker）：

```bash
cd backend
go run .
```

**前端**：

```bash
cd frontend
cp .env.example .env   # 可选，设置 NEXT_PUBLIC_API_URL=http://localhost:7070
npm install
npm run dev            # http://localhost:4000
```

前端通过 Next.js `rewrites` 将 `/api/*` 代理到后端，目标地址由 `NEXT_PUBLIC_API_URL` 控制（默认 `http://leleblog-api:7070`，适配 Docker 网络）。

## 环境变量说明

见 [.env.example](./.env.example)。关键项：

| 变量 | 说明 |
|------|------|
| `JWT_SECRET` | **必填**，JWT 签名密钥；缺失后端拒绝启动 |
| `ADMIN_PASSWORD` | 可选，指定固定管理员密码；留空则随机生成并强制改密 |
| `ALLOWED_ORIGINS` | 允许跨域的前端来源（逗号分隔） |
| `DB_PATH` / `UPLOAD_DIR` | SQLite 与上传文件目录 |
| `NEXT_PUBLIC_API_URL` | 前端代理的后端地址 |

## 安全说明

- JWT 密钥缺失即 fail-fast，不会回退到硬编码默认值。
- CORS 使用白名单（非 `*`），仅回显已配置的合法来源并允许凭据。
- 默认管理员密码为随机生成 + 强制改密，避免 `admin/admin` 弱口令。
- 限流按客户端 IP 生效（尊重 `X-Forwarded-For`），抵御简单爆破。
- 数据库备份使用 `VACUUM INTO` 生成一致性快照；恢复时先备份旧库再原子替换。

## 备份与恢复

后台「备份」页面可导出 `.db` 快照；恢复时上传备份文件，系统会先保留当前库以便回滚。
