# 双休go! 项目交接文档

> 文档日期：2026-09-13  
> 在线站点：https://wxxw2233.xyz  
> 源码仓库：https://github.com/wxw2233/Weekend_go  
> 许可证：MIT（Copyright 2026 wxw2233）

---

## 1. 项目是什么

**双休go!** 是一个「企业休息制度信息目录 + 消费行动」网站。

核心主张：**先问双不双休，再决定买不买。**

产品形态：
- 公开企业库：展示企业是否双休、休息日是哪几天
- 用户可提交标注、纠错补充
- 企业可认领并提交官方材料
- 详情页有评论区（回复 / 点赞 / 删除）
- 管理员审核后台

**判定规则（重要）**：一周任意休息满 **2 天**（含轮休）即计为「双休」，**不限周六周日**。

列表颜色：
| 颜色 | 含义 |
|------|------|
| 绿 | 双休，或明确一周休 ≥2 天 |
| 黄 | 单休 / 大小周 / 排班制 |
| 红 | 不休 |

---

## 2. 技术栈

| 层 | 选型 | 说明 |
|----|------|------|
| 框架 | Next.js 15 + React 19 | App Router |
| 语言 | TypeScript | |
| 样式 | Tailwind CSS 3 | |
| 数据库 | SQLite（`node:sqlite`） | **Node ≥ 22.5 必需** |
| 进程 | pm2 | 生产守护 |
| 反代 | Nginx + Let’s Encrypt | HTTPS |
| 验证码 | 服务端 SVG + HMAC token | 无第三方依赖 |

本地路径（开发机）：`E:\Weekend_Shopping`  
生产路径（服务器）：`/var/www/weekend-shopping`

---

## 3. 线上环境（截至交接时）

| 项 | 值 |
|----|-----|
| 域名 | `wxxw2233.xyz`（含 `www`） |
| 服务器 IP | 通过 DNS 解析域名获取（不写入文档） |
| 系统 | Ubuntu 24.04.1 LTS |
| Node | v22.x（NodeSource） |
| 应用目录 | `/var/www/weekend-shopping` |
| 应用端口 | 127.0.0.1:3000（pm2 `weekend-shopping`） |
| HTTPS | Let’s Encrypt，自动续期 |
| 数据库 | `/var/www/weekend-shopping/data/app.db` |
| 备份 | 每天 03:17，`/usr/local/sbin/sxgo-backup.sh` |
| 备份目录 | `/var/www/weekend-shopping/backups/`（保留 14 份） |
| 备份日志 | `/var/log/sxgo-backup.log` |

**SSH / 服务器密码 / ADMIN_TOKEN 不在本文档中**，见本机 `E:\Weekend_Shopping\.env`（已 gitignore）。

生产环境变量在服务器：`/var/www/weekend-shopping/.env.production`（含 `ADMIN_TOKEN`、`TRUST_PROXY=1`）。

---

## 4. 账号体系

### 4.1 用户
- `/login` 注册 / 登录
- 用户名 2–32 位：中英文、数字、`._-`
- **保留字不可注册**：admin、root、shuangxiu_admin、`<admin>` 等
- 注册**永不**自动成为管理员
- 登录有图形验证码（4 位 SVG）
- 改密码 / 注销：`/account`
- 我的评论：`/me/comments`

### 4.2 管理员
- 用户名：`shuangxiu_admin`
- 角色：`role=admin`（由 `scripts/create-admin-user.cjs` 写入）
- 密码：生产上已单独设置（**不要写进仓库**）
- 口令登录审核台：需环境变量 `ADMIN_TOKEN`  
  - 生产未配置 `ADMIN_TOKEN` 时**拒绝**口令登录（不会回退公开默认值）  
  - 开发环境若未设 `ADMIN_TOKEN`，可用开发默认口令 `shuangxiu-admin`（仅限 `NODE_ENV != production`）

### 4.3 审核入口
- `https://wxxw2233.xyz/admin`
- 管理员账号登录，或 `ADMIN_TOKEN` 口令登录

### 4.4 新建管理员
```bash
# 服务器上
export ADMIN_USERNAME=某管理员
export ADMIN_BOOTSTRAP_PASSWORD='至少12位强口令'
node /var/www/weekend-shopping/scripts/create-admin-user.cjs
```

---

## 5. 功能地图

### 前台
| 路径 | 功能 |
|------|------|
| `/` | 首页 + 企业库（搜索 / 筛选 / 分页 8 条一页） |
| `/companies/[id]` | 企业详情、七日休息条、纠错弹窗、评论 |
| `/submit` | 提交标注（含每周休息日点选、岗位） |
| `/claim` | 企业认领 |
| `/login` | 登录 / 注册（登录要验证码） |
| `/account` | 改密码、注销、入口到我的评论 |
| `/me/comments` | 我的评论列表 |

### 后台 / API
| 路径 | 功能 |
|------|------|
| `/admin` | 审核标注、认领、企业库删除 |
| `POST /api/submit` | 用户标注（限流：成功才计数） |
| `POST /api/claim` | 企业认领 |
| `POST /api/companies/[id]/correct` | 详情页纠错 |
| `GET/POST /api/companies/[id]/comments` | 评论列表 / 发表 |
| `POST .../like` | 点赞 / 取消 |
| `DELETE .../[commentId]` | 删评（本人或管理员） |
| `DELETE /api/companies/[id]` | 删企业（仅管理员） |
| `GET /api/auth/captcha` | 登录验证码 |
| `POST /api/admin/login` | 管理员口令登录 |

### 休息日点选规则
| 类型 | 可选天数 |
|------|----------|
| 双休 | **正好 2 天** |
| 单休 / 大小周 | 1 天 |
| 排班制 | 可多选 |
| 不休 | 无需选 |

`restDays` 存 `[0..6]`（0=周一 … 6=周日），入库后企业库按真实天数点亮。

---

## 6. 数据模型（SQLite）

文件：`data/app.db`（生产在服务器同路径相对位置）

| 表 | 用途 |
|----|------|
| `companies` | 企业库（含 restDays、position） |
| `submissions` | 用户标注 / 纠错（companyRef 指向原企业） |
| `claims` | 企业认领 |
| `comments` | 评论（parentId 回复、软删可显示「已注销」） |
| `comment_likes` | 点赞（commentId+userId 唯一） |
| `users` | 账号（scrypt 加密密码） |
| `user_sessions` | 用户会话 |
| `sessions` | 管理员口令会话 |

**纠错审核通过**：若 `companyRef` 非空，会 **UPDATE 原企业**，不会新增重复条目。

**种子数据**：`src/data/seed.ts`，仅首次空库写入演示企业。

---

## 7. 本地开发

```powershell
# 需要 Node >= 22.5
cd E:\Weekend_Shopping
npm install
npm run dev
# http://localhost:3000
```

生产构建：
```bash
npm run build
npm start
```

本地 `next start` 为 production 模式时：
- 口令登录需 `ADMIN_TOKEN`
- HTTPS 未配置时可用 `COOKIE_SECURE=0` 以便 http localhost 调试

---

## 8. 部署与更新

### 8.1 当前部署方式
1. 本地打包（排除 node_modules、.next、.env、根 data/）
2. SFTP 上传 tarball
3. 服务器解压、`npm ci`、`npm run build`
4. `pm2 restart weekend-shopping`

### 8.2 服务器常用命令
```bash
pm2 ls
pm2 logs weekend-shopping
pm2 restart weekend-shopping
systemctl status nginx
/usr/local/sbin/sxgo-backup.sh   # 手动备份
```

### 8.3 更新代码（示例）
```powershell
# 本地
cd E:\Weekend_Shopping
tar -czf deploy.tgz --exclude=node_modules --exclude=.next --exclude=.ssh-tmp `
  --exclude=backups --exclude=素材 --exclude=.env package.json package-lock.json `
  next.config.ts tsconfig.json tailwind.config.ts postcss.config.mjs README.md src public scripts LICENSE

# 上传后服务器
cd /var/www/weekend-shopping
tar -xzf /tmp/deploy.tgz -C .
npm ci
npm run build
pm2 restart weekend-shopping
```

注意：`--exclude=data` 会误伤 `src/data`，**不要写 `--exclude=data`**，应写 `--exclude=./data` 或干脆不排除再单独处理根目录 data。

### 8.4 HTTPS / Nginx
- 站点配置：`/etc/nginx/sites-available/weekend-shopping`
- 证书：`/etc/letsencrypt/live/wxxw2233.xyz/`
- 续期：certbot 定时任务已配置

---

## 9. 安全与合规（交接必读）

### 已做
- 注册不能提权；用户名保留字黑名单
- 生产无 `ADMIN_TOKEN` 则拒绝口令登录
- 写接口要求 `application/json` + 同源 Origin 校验
- 登录 / 注册 / 提交 / 评论限流；失败冷却
- 登录验证码
- Cookie：httpOnly + sameSite=lax；生产 secure
- XFF 仅在 `TRUST_PROXY=1` 时信任，且取最右
- 注销：评论软删，保留回复链
- 备份 VACUUM INTO + integrity_check

### 法律风险（务必重视）
本产品对「企业是否双休」做公开标注，**有民事与行政风险**：
- 不实信息可能被主张损害商誉
- UGC 需要审核与投诉下架机制
- 运营策略建议：**只通过可核验的双休正面信息**，少做「不休/黑心」曝光
- 非牟利可降低恶意推定，**不能免除**内容责任
- **不要**做排名 / 红黑榜 / 收费删帖

### 仍建议补强
- 隐私政策 / 服务条款页
- 公开投诉邮箱或表单
- 生产密钥轮换流程文档化

---

## 10. 配置项速查

| 环境变量 | 作用 |
|----------|------|
| `ADMIN_TOKEN` | 管理员口令登录；生产必填 |
| `ADMIN_USERNAME` / `ADMIN_BOOTSTRAP_PASSWORD` | 创建管理员脚本 |
| `TRUST_PROXY` | `1` 时信任反代 XFF |
| `COOKIE_SECURE` | 设为 `0` 可在本地 HTTP 下关闭 Secure Cookie |
| `CAPTCHA_SECRET` | 验证码签名密钥（可选，有默认开发值） |

---

## 11. 目录结构（源码）

```
Weekend_Shopping/
  src/
    app/           # 页面与 API
    components/    # UI
    lib/           # db / auth / captcha / rate-limit 等
    data/seed.ts   # 演示种子数据（须入库）
  public/images/   # Hero 图 webp
  scripts/         # 备份、建管、迁移、验证脚本
  middleware.ts    # 安全头
  LICENSE          # MIT
  README.md
  HANDOVER.md      # 本文档
```

**不入库**：`.env`、`data/app.db`、`backups/`、`素材/`、`.next`、`node_modules`

---

## 12. 已知问题 / 后续

| 项 | 说明 |
|----|------|
| 限流在内存 | 重启清空；多实例需 Redis |
| 无自动化测试 | 仅有手工 verify 脚本 |
| 评论分页 | 扁平分页，跨页可能打散楼层（前端有兜底） |
| 验证脚本 | 读 `TEST_USER` / `TEST_PASS` / `ADMIN_TOKEN`，勿写死口令 |
| SSH 偶发超时 | 香港机到本机网络不稳，重试即可 |

---

## 13. 联系与凭证（线下保管）

| 内容 | 保管位置 |
|------|----------|
| 服务器 SSH | 本机 `E:\Weekend_Shopping\.env`（勿提交 Git） |
| 生产 ADMIN_TOKEN | 服务器 `.env.production` + 本机 `.env` |
| 管理员密码 | 创建时生成，线下保存；可随时用脚本重置 |
| GitHub | `wxw2233` / `Weekend_go` |

**交接时请一并线下告知：SSH 密码或改用密钥、ADMIN_TOKEN、管理员密码。**

---

## 14. 快速健康检查

```bash
curl -I https://wxxw2233.xyz/
curl https://wxxw2233.xyz/api/companies
# 服务器
pm2 ls
tail -20 /var/log/sxgo-backup.log
```

期望：首页 200，API 返回 JSON，pm2 online，备份日志有 BACKUP_OK。

---

*本文档随代码可公开；切勿把密钥写回本文件或提交到 GitHub。*
