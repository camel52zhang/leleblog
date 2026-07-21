# leleblog/backend/Dockerfile

# --- 第一阶段：构建镜像 ---
FROM golang:alpine AS builder

# 替换 Alpine 软件源为国内镜像（阿里云） 
RUN sed -i 's/dl-cdn.alpinelinux.org/mirrors.aliyun.com/g' /etc/apk/repositories

# 安装 SQLite 编译所需的 GCC 环境 
RUN apk add --no-cache gcc musl-dev sqlite-dev

WORKDIR /app

# 复制源代码 [cite: 1, 2]
COPY . .

# 设置 Go 代理并编译 [cite: 2]
RUN go env -w GOPROXY=https://goproxy.cn,direct
# 开启 CGO 以支持 SQLite [cite: 2]
# 注意：后端已拆分为多文件（package main），必须编译整个包目录而非单个 main.go
RUN CGO_ENABLED=1 GOOS=linux go build -o server .

# --- 第二阶段：运行镜像 ---
FROM alpine:latest

# 替换运行阶段的环境源 
RUN sed -i 's/dl-cdn.alpinelinux.org/mirrors.aliyun.com/g' /etc/apk/repositories

# 安装运行所需的兼容库和 SQLite 运行库（核心改动）
RUN apk add --no-cache libc6-compat gcompat ca-certificates sqlite-libs

WORKDIR /app

# 从构建阶段复制编译好的二进制文件 [cite: 3]
COPY --from=builder /app/server .

# 创建一个默认的数据存放目录
RUN mkdir -p /data

# 暴露 API 端口 [cite: 3]
EXPOSE 7070

CMD ["./server"]