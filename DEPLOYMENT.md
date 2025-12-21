# 学术作品投票平台 - 部署运行指南

## 📋 系统要求

### 必需软件
- **Node.js** (推荐 v18+)
- **Bun** (推荐) 或 npm/yarn
- **Git**

### 系统配置
- **操作系统**: Windows, macOS, Linux
- **内存**: 最少 2GB RAM
- **存储**: 最少 1GB 可用空间

---

## 🚀 快速部署

### 1. 下载项目
```bash
# 如果您已经下载了项目，请跳过此步骤
# 否则请从源码仓库下载
```

### 2. 进入项目目录
```bash
cd my-project
```

### 3. 安装依赖
```bash
# 使用 Bun (推荐)
bun install

# 或使用 npm
npm install

# 或使用 yarn
yarn install
```

### 4. 环境配置
```bash
# 检查环境变量文件
ls -la .env

# 如果没有 .env 文件，创建一个
cat > .env << EOF
DATABASE_URL=file:./db/custom.db
EOF
```

### 5. 数据库初始化
```bash
# 生成 Prisma 客户端
bun run db:generate

# 推送数据库结构
bun run db:push

# 填充示例数据 (可选)
bunx ts-node prisma/seed.ts
```

### 6. 启动开发服务器
```bash
# 启动开发服务器
bun run dev

# 服务器将在 http://localhost:3000 启动
```

---

## 🏗️ 生产环境部署

### 1. 构建项目
```bash
# 构建生产版本
bun run build
```

### 2. 启动生产服务器
```bash
# 启动生产服务器
bun run start
```

### 3. 使用 PM2 管理进程 (推荐)
```bash
# 安装 PM2
npm install -g pm2

# 启动应用
pm2 start bun --name "voting-platform" -- start

# 查看状态
pm2 status

# 查看日志
pm2 logs voting-platform
```

---

## 🐳 Docker 部署

### 1. 创建 Dockerfile
```dockerfile
FROM node:18-alpine

WORKDIR /app

# 安装 Bun
COPY package.json bun.lockb ./
RUN npm install -g bun

# 安装依赖
RUN bun install

# 复制项目文件
COPY . .

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

# 启动应用
CMD ["bun", "start"]
```

### 2. 构建和运行
```bash
# 构建镜像
docker build -t voting-platform .

# 运行容器
docker run -p 3000:3000 voting-platform
```

---

## 🔧 配置说明

### 数据库配置
```env
# SQLite (默认)
DATABASE_URL=file:./db/custom.db

# PostgreSQL (生产环境推荐)
# DATABASE_URL=postgresql://username:password@localhost:5432/voting_platform

# MySQL
# DATABASE_URL=mysql://username:password@localhost:3306/voting_platform
```

### 环境变量
```env
# 数据库连接
DATABASE_URL=file:./db/custom.db

# Next.js 配置
NODE_ENV=development  # 或 production

# 端口配置
PORT=3000
```

---

## 📁 目录结构
```
my-project/
├── src/                    # 源代码
│   ├── app/                # Next.js App Router
│   ├── components/          # React 组件
│   └── lib/               # 工具库
├── prisma/                 # 数据库配置
│   ├── schema.prisma       # 数据库模式
│   └── seed.ts            # 示例数据
├── public/                 # 静态资源
│   └── uploads/           # 上传文件存储
├── db/                    # 数据库文件
├── .env                    # 环境变量
├── package.json            # 项目配置
└── README.md              # 项目说明
```

---

## 🛠️ 常用命令

### 开发命令
```bash
# 启动开发服务器
bun run dev

# 代码检查
bun run lint

# 数据库操作
bun run db:push      # 推送数据库结构
bun run db:generate   # 生成 Prisma 客户端
bun run db:reset      # 重置数据库
```

### 生产命令
```bash
# 构建生产版本
bun run build

# 启动生产服务器
bun run start
```

---

## 🔍 故障排除

### 常见问题

#### 1. 端口被占用
```bash
# 查看端口占用
lsof -i :3000

# 杀死进程
kill -9 <PID>

# 或使用其他端口
PORT=3001 bun run dev
```

#### 2. 数据库连接错误
```bash
# 检查数据库文件
ls -la db/custom.db

# 重新推送数据库结构
bun run db:push --force-reset
```

#### 3. 依赖安装失败
```bash
# 清除缓存
rm -rf node_modules bun.lockb

# 重新安装
bun install
```

#### 4. 权限问题
```bash
# 给予执行权限
chmod +x scripts/*.sh

# 创建必要目录
mkdir -p public/uploads
chmod 755 public/uploads
```

---

## 🌐 访问应用

### 本地访问
- **开发环境**: http://localhost:3000
- **生产环境**: http://localhost:3000

### 网络访问
```bash
# 查看本机IP
ipconfig  # Windows
ifconfig  # macOS/Linux

# 使用IP访问
http://YOUR_IP:3000
```

---

## 📊 监控和日志

### 日志文件
```bash
# 开发日志
tail -f dev.log

# 生产日志
tail -f server.log
```

### 性能监控
```bash
# 使用 PM2 监控
pm2 monit

# 查看资源使用
pm2 show voting-platform
```

---

## 🔒 安全配置

### 生产环境建议
1. **使用 HTTPS**
2. **配置防火墙**
3. **定期备份数据库**
4. **更新依赖包**
5. **配置反向代理**

### 环境变量保护
```bash
# 设置文件权限
chmod 600 .env

# 不要提交到版本控制
echo ".env" >> .gitignore
```

---

## 🚀 快速启动脚本

创建 `start.sh` 文件：
```bash
#!/bin/bash

echo "🚀 启动学术作品投票平台..."

# 检查依赖
if [ ! -d "node_modules" ]; then
    echo "📦 安装依赖..."
    bun install
fi

# 初始化数据库
echo "🗄️ 初始化数据库..."
bun run db:generate
bun run db:push
bunx ts-node prisma/seed.ts

# 启动服务
echo "🌐 启动服务..."
bun run dev
```

使用方法：
```bash
chmod +x start.sh
./start.sh
```

---

## 📞 技术支持

如果遇到问题，请检查：
1. **Node.js 版本**: `node --version`
2. **Bun 版本**: `bun --version`
3. **端口状态**: `netstat -an | grep 3000`
4. **错误日志**: `cat dev.log`

---

**🎉 部署成功后，您就可以访问学术作品投票平台了！**