# leleblog/frontend/Dockerfile

FROM node:20-alpine AS builder

WORKDIR /app

# 1. 复制依赖文件 
COPY package*.json ./

# 2. 安装依赖 
RUN npm ci || npm install

# 3. 复制源代码并执行构建 
COPY . .
RUN npm run build

# --- 生产阶段 ---
FROM node:20-alpine
WORKDIR /app

# 设置生产环境标识
ENV NODE_ENV=production

# 复制必要的文件 
COPY --from=builder /app/package*.json ./
COPY --from=builder /app/.next ./.next
COPY --from=builder /app/public ./public
COPY --from=builder /app/node_modules ./node_modules

EXPOSE 4000
# 启动前端服务 
CMD ["npm", "start", "--", "-p", "4000"]