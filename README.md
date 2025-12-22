# 学术作品投票平台

一个基于 Next.js 15 和 TypeScript 构建的学术作品提交与投票系统，支持中英双语界面，具备完整的后台管理功能。

## 🌟 功能特性

### 用户端功能
- 📝 **作品提交**: 支持论文、海报、演示三种类型
- 🗳️ **投票系统**: 用户可为喜欢的作品投票
- 🌍 **多语言支持**: 中文/英文界面切换
- 📱 **响应式设计**: 支持桌面端和移动端

### 管理端功能
- 🔐 **管理员系统**: 安全的登录认证
- 📊 **数据统计**: 用户、作品、投票数量统计
- 📋 **作品管理**: 添加、编辑、删除作品
- 👥 **用户管理**: 用户权限管理，账户删除
- 🗳️ **投票管理**: 投票记录查看、删除、数据导出

## 🚀 快速开始

### 环境要求
- Node.js 18+ 或 Bun
- Git

### 安装依赖
```bash
# 使用 Bun (推荐)
bun install

# 或使用 npm
npm install
```

### 启动应用

#### 方法1: 使用启动脚本 (推荐)
```bash
# 使用默认端口 (443)
./start.sh

# 指定端口
./start.sh --port=3000
./start.sh -p8080

# 启动并添加演示数据
./start.sh --demo

# Windows 用户
start.bat
start.bat --port=3000
start.bat --demo
```

#### 方法2: 直接使用 npm/bun 命令
```bash
# 初始化数据库
bun run db:generate
bun run db:push

# 启动开发服务器 (默认端口 3000)
bun run dev
```

### 访问地址
- **中文版**: http://localhost:8888/zh/
- **英文版**: http://localhost:8888/en/
- **管理后台**: http://localhost:8888/admin/login

### 管理员登录
- **用户名**: zhipuai
- **密码**: aminer

## 📁 项目结构

```
vote/
├── src/
│   ├── app/                    # Next.js App Router
│   │   ├── zh/                # 中文版页面
│   │   ├── en/                # 英文版页面
│   │   ├── admin/             # 后台管理页面
│   │   └── api/               # API 路由
│   ├── components/            # React 组件
│   │   ├── admin/            # 后台管理组件
│   │   └── ui/               # UI 组件
│   └── lib/                  # 工具库
├── prisma/                   # 数据库相关
│   ├── schema.prisma        # 数据库模式
│   └── seed.ts              # 测试数据
├── public/                   # 静态资源
├── db/                      # 数据库文件
├── start.sh                 # Linux/macOS 启动脚本
├── start.bat               # Windows 启动脚本
├── clean-db.sh             # Linux/macOS 清理脚本
└── clean-db.bat           # Windows 清理脚本
```

## 🛠️ 数据库管理

### 清理数据库
```bash
# 查看帮助
./clean-db.sh --help

# 清空所有数据（保留结构）
./clean-db.sh --data

# 完全重置数据库
./clean-db.sh --reset

# 重置并添加演示数据
./clean-db.sh --reset-demo

# 备份当前数据库
./clean-db.sh --backup

# 删除所有数据库文件
./clean-db.sh --all
```

### 添加演示数据
```bash
# 方式1: 启动时添加
./start.sh --demo

# 方式2: 手动添加
bunx tsx prisma/seed.ts
```

## 🚀 部署

### 生产环境部署

#### 方法1: Docker 部署
```bash
# 构建镜像
docker build -t vote-platform .

# 运行容器
docker run -p 3000:3000 vote-platform
```

#### 方法2: 手动部署
```bash
# 安装依赖
bun install

# 构建应用
bun run build

# 启动生产服务器
bun run start
```

#### 方法3: Vercel 部署
```bash
# 安装 Vercel CLI
npm i -g vercel

# 部署
vercel

# 配置环境变量
vercel env add DATABASE_URL
vercel env add JWT_SECRET
```

### 环境变量配置
创建 `.env` 文件：
```env
# 数据库配置
DATABASE_URL="file:./db/custom.db"

# JWT 密钥 (生产环境请使用强密码)
JWT_SECRET="your-secret-key-change-in-production"

# 管理员账户 (可选，默认为 zhipuai/aminer)
ADMIN_USERNAME="zhipuai"
ADMIN_PASSWORD="aminer"
```

## 🔧 开发

### 开发命令
```bash
# 启动开发服务器
bun run dev

# 数据库操作
bun run db:generate    # 生成 Prisma Client
bun run db:push       # 推送数据库模式
bun run db:migrate    # 运行数据库迁移

# 代码检查
bun run lint

# 类型检查
bun run type-check
```

### 技术栈
- **前端**: Next.js 15, React 19, TypeScript
- **UI**: Tailwind CSS, shadcn/ui
- **数据库**: SQLite + Prisma ORM
- **认证**: JWT
- **构建工具**: Bun

## 📋 用户使用指南

### 作品提交
- **必填信息**：作品标题、作者姓名、学号、邮箱地址
- **可选信息**：合作作者及其学号、作品描述、摘要、关键词
- **文件上传**：支持 PDF、Word、PPT 等格式
- **作品类型**：学术论文、学术海报、演示项目

### 参与投票
- **身份验证**：使用学号和姓名进行身份验证
- **投票限制**：每位同学最多可以投 5 票
- **防重复投票**：同一作品只能投一次票
- **实时显示**：显示剩余票数

### 使用流程
1. **提交作品**：点击"上传作品"按钮，填写信息并提交
2. **参与投票**：输入学号姓名，选择喜欢的作品投票
3. **查看结果**：在排行榜查看最受欢迎的作品

## 🔒 安全注意事项

1. **修改默认密码**: 生产环境中请修改管理员默认密码
2. **JWT 密钥**: 使用强密码作为 JWT 密钥
3. **HTTPS**: 生产环境请使用 HTTPS
4. **数据库备份**: 定期备份数据库
5. **访问控制**: 考虑添加 IP 白名单或访问频率限制

## 📝 注意事项

1. **学号唯一性**：每个学号只能对应一个用户
2. **投票公平性**：禁止刷票，每人限5票
3. **作品原创性**：请确保提交的作品为原创
4. **信息准确性**：请填写真实的学号和联系信息

## 🎁 评选规则

- 投票结束后，获票数最多的前X名作品将获得上台展示机会
- 展示时间：最后一周
- 具体展示顺序将根据投票结果确定

## 📊 API 接口

### 用户端 API
- `POST /api/submissions` - 提交作品
- `GET /api/submissions` - 获取作品列表
- `POST /api/vote` - 投票
- `GET /api/stats` - 获取统计数据

### 管理端 API
- `POST /api/admin/login` - 管理员登录
- `GET /api/admin/submissions` - 管理作品
- `POST /api/admin/submissions` - 创建作品
- `PUT /api/admin/submissions/[id]` - 更新作品
- `DELETE /api/admin/submissions/[id]` - 删除作品
- `GET /api/admin/users` - 管理用户
- `PUT /api/admin/users/[id]/toggle-admin` - 切换管理员权限
- `DELETE /api/admin/users/[id]` - 删除用户
- `GET /api/admin/votes` - 管理投票
- `DELETE /api/admin/votes/[id]` - 删除投票
- `GET /api/admin/stats` - 获取管理统计数据

## 🤝 贡献

欢迎提交 Issue 和 Pull Request！

## 📄 许可证

MIT License

## 📞 支持

如有问题，请提交 Issue 或联系开发团队。

---

**祝您使用愉快！** 🎉