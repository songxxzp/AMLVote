FROM node:18-alpine

WORKDIR /app

# 安装 Bun
COPY package.json bun.lockb ./
RUN npm install -g bun

# 安装依赖
RUN bun install --frozen-lockfile

# 复制项目文件
COPY . .

# 创建必要目录
RUN mkdir -p public/uploads db

# 生成 Prisma 客户端
RUN bun run db:generate

# 推送数据库结构
RUN bun run db:push

# 填充示例数据
RUN bunx ts-node prisma/seed.ts

# 构建应用
RUN bun run build

# 暴露端口
EXPOSE 3000

# 健康检查
HEALTHCHECK --interval=30s --timeout=3s --start-period=5s --retries=3 \
  CMD curl -f http://localhost:3000 || exit 1

# 启动应用
CMD ["bun", "start"]