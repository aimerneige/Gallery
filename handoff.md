# Gallery (画廊) - Cloudflare D1 + Zero Trust 云原生架构开发方案

本文档详细规划了 **Gallery (画廊)** 项目从“本地 SQLite 管理工具”升级为“**Cloudflare D1 + Cloudflare Pages + Zero Trust 边缘控制台**”的完整云原生开发方案。

---

## 🎯 方案目标与核心收益

1. **随时随地跨设备管理**：无需依赖本地电脑运行 `localhost:3000` 或 Go CLI，可使用任何设备（手机、平板、电脑）访问在线管理面板直接上传与更新照片。
2. **企业级 Zero Trust 安全防护**：基于 Cloudflare Access 为管理控制台域名设置访问控制（支持 GitHub OAuth 或 Email 验证码），未授权流量在 Cloudflare 边缘节点直接被拦截。
3. **云端 SQLite 数据库 (Cloudflare D1)**：元数据存储由本地文件转为 Cloudflare 边缘端分布式 D1 数据库（免费 5 GB，与当前 SQLite Schema 100% 兼容）。
4. **边缘端零成本架构**：利用现有的 Cloudflare 免费层服务（D1 + Pages + Pages Functions + R2 + Zero Trust Access），维持 **$0 运维成本**。
5. **SSG 静态分发保持不变**：公开画廊保持在 GitHub Pages / Cloudflare Pages 上运行，访问速度极快。

---

## 🏗️ 整体系统架构与数据流 (System Architecture)

```mermaid
graph TD
    subgraph 1. 云端安全控制台 (Admin Realm)
        User[管理员手机 / 电脑] -->|1. 访问 admin.gallery.aimer.moe| ZeroTrust[Cloudflare Zero Trust Access]
        ZeroTrust -->|2. GitHub/Email OAuth 验证通过| CFPages[Cloudflare Pages: manage/web 前端]
        CFPages -->|3. 调用 Edge API /api/*| Functions[Cloudflare Pages Functions API]
        
        Functions -->|4. SQL CRUD 操作| D1[(Cloudflare D1: gallery-db)]
        Functions -->|5. 存储 WebP 图片| R2[(Cloudflare R2 Storage)]
    end

    subgraph 2. SSG 构建与自动部署 (Build Pipeline)
        GHAction[GitHub Actions / 本地部署] -->|1. 触发构建| Wrangler[Wrangler CLI / API Fetch]
        Wrangler -->|2. 从 D1 导出完整数据| D1
        Wrangler -->|3. 生成 minified JSON| PublicJSON[public/data.json]
        PublicJSON -->|4. Vite Build 打包| DeployScript[deploy.sh]
        DeployScript -->|5. 推送至目标仓库| GHPages[GitHub Pages: gallery.aimer.moe]
    end

    subgraph 3. 公开画廊展示 (Public Realm)
        Visitor[全球访客] -->|访问 gallery.aimer.moe| GHPages
        GHPages -->|拉取数据| PublicJSON
        GHPages -->|展示图片| R2
    end
```

---

## 📋 模块重构与迁移设计 (Component Specification)

### 1. 数据库层：Cloudflare D1 (Serverless SQLite)

* **数据库名称**：`gallery-db`
* **Schema 结构**（与当前 `gallery.db` 完全一致，无缝迁移）：
  - `photos`: `(id, title, description, author, r2_url, width, height, camera_make, camera_model, camera_lens, aperture, shutter_speed, iso, focal_length, focal_length_35mm, date_taken, exposure_program, metering_mode, location_name, latitude, longitude)`
  - `albums`: `(id, name, description, cover_photo_id)`
  - `photo_albums`: `(photo_id, album_id)`
  - `photo_tags`: `(photo_id, tag)`
* **数据迁移**：通过 `wrangler d1 execute gallery-db --file=./schema.sql` 完成表结构初始化，使用 `compile-data.ts` 的导出数据填充 D1。

---

### 2. 服务端/API 层：Express -> Cloudflare Pages Functions

当前 `manage/web/server` 采用 Node.js/Express 运行在本地。在新架构中，将移除本地 Node.js 进程，转换为部署在 Cloudflare Pages 上的 **Pages Functions (`functions/api/[[path]].ts`)**：

| API 路由 | 原 Express 实现 | 转换后的 Cloudflare Pages Functions | 说明 |
| :--- | :--- | :--- | :--- |
| `GET /api/data` | 读取本地 SQLite 文件 | `env.DB.prepare('SELECT ...').all()` | 获取画廊所有相册与照片数据 |
| `POST /api/upload` | 本地 `sharp` 压缩 + R2 SDK 上传 | 客户端 WebP 压缩 + Pages Functions 绑定上传 | 照片上传与元数据落库 |
| `POST /api/extract-exif` | Node `exifreader` | 客户端 / Functions 内置 `exifr` 解析 | 提取上传照片的 EXIF 参数 |
| `PUT /api/photos/:id` | 本地 SQLite UPDATE | `env.DB.prepare('UPDATE photos ...').run()` | 更新照片元数据 |
| `DELETE /api/photos/:id` | 本地 SQLite DELETE | `env.DB.prepare('DELETE FROM photos ...').run()` | 删除照片 |
| `POST/PUT/DELETE /api/albums` | 本地 SQLite 相册操作 | `env.DB.prepare(...)` | 相册增删改查 |

> **关键优化 (WebP 图像压缩解耦)**：
> 在边缘端 Serverless 函数中使用 Node.js C++ 原生库 `sharp` 较为困难。
> **改动方案**：将 WebP 图像压缩与调整尺寸的计算移至客户端（使用 HTML5 `OffscreenCanvas` / `Canvas`），上传前已是高压缩率的 WebP 文件，Pages Functions 仅需透明传输至 R2 绑定 (`env.R2_BUCKET.put()`)，大大减少边缘计算延迟。

---

### 3. 安全防护：Cloudflare Zero Trust Access

* **防护对象**：管理控制台域名（如 `admin.gallery.aimer.moe` 或 `manage.gallery.aimer.moe`）。
* **配置步骤**：
  1. 在 Cloudflare 控制台中添加 **Zero Trust Access Application**。
  2. 域名填入控制台目标 CNAME。
  3. 配置身份验证策略 (Policies)：
     - **Action**: Allow
     - **Include**: Emails / GitHub Accounts (指定管理员个人的 Email / GitHub 账号)。
  4. 开启 **Identity Providers**（例如一键配置 Email One-Time PIN 或 GitHub OAuth）。

---

### 4. 数据发布与 SSG 编译同步 (SSG Build & Data Sync)

在 GitHub Pages 部署模式下，公共画廊从 `public/data.json` 读取数据。

* **自动导出流程 (GitHub Actions / 本地 cli)**：
  1. 触发命令或 GitHub Actions 工作流。
  2. 运行 Wrangler 命令导出 D1 最新的 SQLite 数据：
     ```bash
     npx wrangler d1 execute gallery-db --command "SELECT * FROM photos; SELECT * FROM albums;" --json > public/data.json
     ```
  3. 运行 `npm run build` 打包。
  4. 执行 `deploy.sh` 推送至 `gallery.aimer.moe` 目标仓库。

---

## 🚀 阶段实施路线图 (Implementation Roadmap)

### 第一阶段：准备与配置文件编写 (Preparation)
- [ ] 创建项目 `wrangler.toml` 配置文件（定义 D1 数据库与 R2 Bucket 绑定）。
- [ ] 导出包含全量样例数据的 `data/schema.sql` 初始脚本。
- [ ] 创建 Cloudflare Pages 项目配置文件。

### 第二阶段：前端图像压缩与 Pages Functions 接口适配 (Functions & Client Refactoring)
- [ ] 在 `manage/web/src/utils/imageCompressor.ts` 中实现基于 Canvas 的浏览器端 WebP 格式化与缩放工具。
- [ ] 创建 `manage/web/functions/api/[[path]].ts` 替换原 Express 服务器，对接 D1 (`env.DB`) 与 R2 (`env.R2`)。
- [ ] 适配 `manage/web` 部署构建（生成静态 HTML + Functions）。

### 第三阶段：Cloudflare 部署与 Zero Trust 绑定 (Deployment & Security)
- [ ] 使用 Wrangler 创建云端 D1 数据库并导入 schema。
- [ ] 部署 `manage/web` 至 Cloudflare Pages。
- [ ] 在 Cloudflare Dashboard 配置 Zero Trust Access 策略，绑定管理员邮箱。

### 第四阶段：SSG 数据流与构建自动化 (Build & Sync Automation)
- [ ] 编写自动从 D1 获取数据并更新 `public/data.json` 的编译脚本 `scripts/compile-d1.ts`。
- [ ] 更新 `README.md` 与 `deploy.sh` 说明。

### 第五阶段：集成验证与测试 (Verification & Testing)
- [ ] 测试管理端访问拦截（未登录状态下拒绝访问）。
- [ ] 测试管理员登录后上传新照片、解析 EXIF、增删相册功能。
- [ ] 测试 GitHub Pages 静态打包导出与全网分发。

---

## 📌 总结

本开发方案在保持公共画廊高扩展性、零出站流量费与超快静态加载的前提下，完全去除了本地运行控制台的限制。所有改动均可在 Cloudflare 免费额度内实现。
