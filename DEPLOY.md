# 机电校园 — Vercel + Supabase 独立部署指南

本文档说明如何将本应用从妙搭平台导出后，部署到 Vercel（前端 + Serverless 后端）+ Supabase（PostgreSQL 数据库），实现完全公开访问。

---

## 一、项目结构说明

```
项目根目录/
├── vercel.json                    # Vercel 部署配置（核心入口）
├── api/
│   └── index.js                   # Vercel Serverless 函数入口（NestJS 适配层）
├── deploy/
│   └── build.js                   # Vercel 构建脚本（安装依赖 + 编译前后端）
│
├── server/
│   ├── main.standalone.ts         # 独立部署版后端入口（替代 main.ts）
│   ├── app.module.ts              # 根模块（已移除 PlatformModule，改用 DrizzleModule）
│   ├── common/
│   │   ├── drizzle/
│   │   │   └── drizzle.module.ts  # 独立 Drizzle 数据库连接模块
│   │   └── guards/
│   │       └── jwt-auth.guard.ts  # JWT 鉴权（从环境变量读取 secret）
│   └── modules/
│       ├── auth/                  # 注册/登录
│       ├── posts/                 # 帖子
│       ├── comments/              # 评论
│       ├── likes/                 # 点赞
│       ├── users/                 # 用户资料
│       ├── admin/                 # 管理后台
│       ├── upload/                # 图片上传（Vercel Blob）
│       └── hello/                 # 示例模块（未启用）
│
├── client/
│   └── src/
│       ├── main.standalone.tsx    # 独立部署版前端入口（替代 index.tsx）
│       ├── api/app.ts             # API 层（已替换为原生 axios）
│       ├── utils/logger.ts        # 本地 logger 实现
│       └── pages/                 # 所有页面（已替换平台组件依赖）
│
├── shared/
│   └── api.interface.ts           # 前后端共享类型
│
├── vite.config.standalone.ts      # 独立版 Vite 配置
├── nest-cli.standalone.json       # 独立版 Nest CLI 配置
├── tsconfig.node.standalone.json  # 独立版服务端 TS 配置
├── tsconfig.app.standalone.json   # 独立版前端 TS 配置
│
├── package.json                   # 原始 package.json（平台管理，不要改）
├── nest-cli.json                  # 原始 Nest CLI 配置
├── vite.config.ts                 # 原始 Vite 配置（平台管理，不要改）
└── tsconfig.json / tsconfig.*.json # 原始 TS 配置（平台管理，不要改）
```

> ⚠️ 注意：`package.json`、`vite.config.ts`、`client/src/index.tsx`、`server/main.ts` 等是平台原始文件，独立部署时使用 `*.standalone.*` 版本。

---

## 二、部署前准备

### 1. 注册账号

- [Vercel](https://vercel.com) — 前端 + Serverless 后端部署（免费版即可）
- [Supabase](https://supabase.com) — PostgreSQL 数据库（免费版即可）
- [GitHub](https://github.com) — 代码托管（Vercel 从 GitHub 拉取代码）

### 2. 导出项目代码

从妙搭预览窗口下载代码 ZIP 包，解压到本地。

---

## 三、Supabase 数据库初始化

1. 登录 Supabase → 新建项目（选择离你最近的区域）
2. 等待项目创建完成（约 1-2 分钟）
3. 左侧菜单 → SQL Editor → New query
4. 粘贴以下 SQL 并执行：

```sql
-- 启用 UUID 扩展
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- 用户表
CREATE TABLE IF NOT EXISTS app_user (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  phone VARCHAR(20) NOT NULL UNIQUE,
  password_hash VARCHAR(255) NOT NULL,
  nickname VARCHAR(50) NOT NULL,
  avatar_url TEXT,
  bio VARCHAR(200),
  is_admin BOOLEAN DEFAULT FALSE,
  is_banned BOOLEAN DEFAULT FALSE,
  nickname_updated_at TIMESTAMPTZ(3),
  _created_at TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  _updated_at TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP
);
CREATE UNIQUE INDEX IF NOT EXISTS app_user_phone_key ON app_user(phone);
CREATE INDEX IF NOT EXISTS idx_user_phone ON app_user(phone);

-- 帖子表
CREATE TABLE IF NOT EXISTS post (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  author_id UUID NOT NULL REFERENCES app_user(id) ON DELETE CASCADE,
  content TEXT NOT NULL,
  image_urls TEXT[] DEFAULT '{}',
  like_count INTEGER DEFAULT 0,
  comment_count INTEGER DEFAULT 0,
  share_count INTEGER DEFAULT 0,
  is_visible BOOLEAN DEFAULT TRUE,
  _created_at TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  _updated_at TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP
);
CREATE INDEX IF NOT EXISTS idx_post_author ON post(author_id);
CREATE INDEX IF NOT EXISTS idx_post_created ON post(_created_at);
CREATE INDEX IF NOT EXISTS idx_post_visible ON post(is_visible);

-- 评论表
CREATE TABLE IF NOT EXISTS comment (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  post_id UUID NOT NULL REFERENCES post(id) ON DELETE CASCADE,
  author_id UUID NOT NULL REFERENCES app_user(id) ON DELETE CASCADE,
  content TEXT NOT NULL,
  like_count INTEGER DEFAULT 0,
  _created_at TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  _updated_at TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP
);
CREATE INDEX IF NOT EXISTS idx_comment_post ON comment(post_id);
CREATE INDEX IF NOT EXISTS idx_comment_created ON comment(_created_at);

-- 点赞表
CREATE TABLE IF NOT EXISTS post_like (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  post_id UUID NOT NULL REFERENCES post(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES app_user(id) ON DELETE CASCADE,
  _created_at TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP
);
CREATE UNIQUE INDEX IF NOT EXISTS post_like_post_id_user_id_key ON post_like(post_id, user_id);
CREATE INDEX IF NOT EXISTS idx_like_post ON post_like(post_id);
CREATE INDEX IF NOT EXISTS idx_like_user ON post_like(user_id);

-- 敏感词表
CREATE TABLE IF NOT EXISTS sensitive_word (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  word VARCHAR(100) NOT NULL UNIQUE,
  category VARCHAR(50) DEFAULT 'general',
  _created_at TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP
);
CREATE UNIQUE INDEX IF NOT EXISTS sensitive_word_word_key ON sensitive_word(word);

-- 插入初始敏感词
INSERT INTO sensitive_word (word, category) VALUES
  ('色情', 'porn'),
  ('黄色', 'porn'),
  ('暴力', 'violence'),
  ('血腥', 'violence'),
  ('傻逼', 'profanity'),
  ('操你妈', 'profanity'),
  ('草泥马', 'profanity')
ON CONFLICT (word) DO NOTHING;

-- 创建初始管理员（手机号: 13800000001, 密码: admin123）
INSERT INTO app_user (phone, password_hash, nickname, is_admin, bio)
VALUES (
  '13800000001',
  '$2a$10$N9qo8uLOickgx2ZMRZoMyeIjZAgcfl7p92ldGxad68LJZdL17lhWy',
  '校园管理员',
  TRUE,
  '机电校园官方管理员账号'
)
ON CONFLICT (phone) DO NOTHING;
```

5. 左侧菜单 → Table Editor，确认能看到 5 张表：`app_user`、`post`、`comment`、`post_like`、`sensitive_word`

### 获取数据库连接串

左侧菜单 → Settings → Database → 找到 **Connection string** → 复制 URI（格式类似 `postgresql://postgres:xxxx@db.supabase.co:5432/postgres`），保存备用。

---

## 四、上传代码到 GitHub

1. 在 GitHub 新建一个仓库（Public 或 Private 都可以）
2. 把解压后的代码 push 到仓库
3. 确认 `vercel.json`、`api/index.js`、`deploy/build.js` 在仓库根目录

---

## 五、部署到 Vercel

### 步骤 1：导入项目

1. 登录 Vercel → 点击 **Add New...** → **Project**
2. 找到刚才的 GitHub 仓库 → 点击 **Import**

### 步骤 2：配置环境变量

在 **Environment Variables** 部分，添加以下变量：

| 变量名 | 值 | 说明 |
|--------|----|------|
| `DATABASE_URL` | 你的 Supabase 连接串 | 从 Supabase Settings → Database 复制 |
| `JWT_SECRET` | 一串随机字符串 | 比如用密码管理器生成 32 位随机字符串 |
| `JWT_EXPIRES_IN` | `7d` | Token 有效期（7 天） |
| `BLOB_READ_WRITE_TOKEN` | Vercel Blob Token | 先留空，部署后开通 Blob 再添加 |

> ⚠️ **JWT_SECRET 务必设置为随机强密码**，否则账号安全无法保证。

### 步骤 3：点击 Deploy

等待构建完成（约 3-8 分钟）。如果构建失败，查看 Build Log 定位问题。

### 步骤 4：开通 Vercel Blob（图片上传用）

1. 部署成功后，进入项目 → **Storage** 标签
2. 点击 **Connect Store** → 选择 **Blob** → Create
3. 选择你的项目 → Connect
4. 环境变量 `BLOB_READ_WRITE_TOKEN` 会自动注入
5. 需要重新部署一次才能生效（点击 **Redeploy**）

---

## 六、验证部署

部署成功后，访问 Vercel 分配的域名（类似 `xxx.vercel.app`）：

- [ ] 首页能正常打开，看到帖子列表
- [ ] 点击"注册"，用手机号 + 密码注册一个新账号
- [ ] 登录成功，跳转到首页
- [ ] 点击发帖，输入文字，点击发布
- [ ] 帖子出现在列表中
- [ ] 点击点赞，点赞数变化
- [ ] 点击评论，发表评论
- [ ] 用管理员账号（13800000001 / admin123）登录，访问 /admin 查看管理后台
- [ ] 发帖时测试图片上传功能

---

## 七、绑定自定义域名（可选）

1. Vercel 项目 → Settings → Domains → Add Domain
2. 输入你的域名，点击 Add
3. 按照提示去你的域名服务商添加 DNS 解析
4. Vercel 会自动配置 SSL 证书

---

## 八、常见问题排查

### Q1: 构建失败 — 找不到模块 `@vercel/blob` 等

A: 构建脚本 `deploy/build.js` 会自动安装额外依赖。如果失败，检查 npm 日志确认网络是否正常。

### Q2: 启动后访问 /api/* 返回 500

A: 检查 `DATABASE_URL` 是否正确。去 Vercel 项目 → Logs 查看具体错误信息。

### Q3: 图片上传失败

A: 检查是否已开通 Vercel Blob 并完成连接。`BLOB_READ_WRITE_TOKEN` 环境变量必须存在。

### Q4: 管理员密码登录失败

A: 初始管理员的 bcrypt 哈希可能与 bcryptjs 版本不兼容。解决方法：
1. 先注册一个普通账号
2. 在 Supabase SQL Editor 执行：`UPDATE app_user SET is_admin = TRUE WHERE phone = '你的手机号';`

### Q5: Vercel Serverless 冷启动慢

A: 免费版冷启动约 1-3 秒，属于正常现象。付费版可配置预热。

### Q6: 本地开发怎么跑？

```bash
# 安装依赖
npm install --legacy-peer-deps
npm install @vendia/serverless-express postgres @vercel/blob @vitejs/plugin-react @types/multer --save

# 启动后端（端口 3000）
npm run dev:server -- --config nest-cli.standalone.json --entryFile main.standalone

# 启动前端（另开终端，端口 5173）
npx vite --config vite.config.standalone.ts
```

前端会通过 Vite 代理把 `/api/*` 请求转发到 `http://localhost:3000`。

---

## 九、已移除的平台依赖清单

| 依赖包 | 移除后替代方案 |
|--------|--------------|
| `@lark-apaas/fullstack-nestjs-core` | 独立 DrizzleModule + ConfigModule |
| `@lark-apaas/client-toolkit` | 原生 axios + 本地 logger + 本地组件 |
| `@lark-apaas/coding-preset-vite-react` | `@vitejs/plugin-react` + 独立 vite 配置 |
| `@lark-apaas/fullstack-presets` | 独立 tsconfig |
| `@lark-apaas/db-schema-sync` | `drizzle-kit`（如需同步 schema） |
| `fullstack-cli` (postinstall) | 不再需要 |
| 飞书 dataloom 文件存储 | Vercel Blob + 后端上传接口 |
| 飞书 AppContainer / ErrorRender / NotFoundRender | 本地实现 |
| 飞书 UniversalLink / resolveAppUrl | react-router-dom Link + window.location |
| 飞书 userProfile 复合类型 | 标准 UUID |

---

## 十、环境变量汇总

| 变量名 | 必填 | 说明 | 默认值 |
|--------|------|------|--------|
| `DATABASE_URL` | ✅ | Supabase PostgreSQL 连接串 | - |
| `JWT_SECRET` | ✅ | JWT 签名密钥 | 内置弱默认值（生产务必修改） |
| `JWT_EXPIRES_IN` | ❌ | JWT Token 有效期 | `7d` |
| `BLOB_READ_WRITE_TOKEN` | 图片上传必填 | Vercel Blob 读写 Token | - |
| `NODE_ENV` | ❌ | 运行环境 | Vercel 自动设为 production |
| `CLIENT_BASE_PATH` | ❌ | 前端路由基础路径 | `/` |
