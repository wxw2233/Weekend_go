# 双休go!

信息目录 + 消费行动站：帮助企业休息制度被看见，让消费者优先选择落实双休的品牌。

## 本地启动

需要 **Node >= 22.5**（使用内置 `node:sqlite`）。

```bash
npm install
npm run dev
```

打开 [http://localhost:3000](http://localhost:3000)。

## 功能

- 企业库：搜索 / 筛选 / 分页；绿黄红标识休息水平
- 用户标注、企业认领；审核后台 `/admin`
- 详情页：纠错弹窗、评论（回复/点赞/删除）、SEO 标题描述
- 账号：注册登录、改密码、注销、`/me/comments` 我的评论
- 限流：提交/认领/注册/评论/点赞/登录

## 路由速查

| 路径 | 说明 |
|------|------|
| `/` | 首页企业库 |
| `/login` | 登录 / 注册 |
| `/account` | 改密码 / 注销 / 我的评论入口 |
| `/me/comments` | 我的评论 |
| `/claim` | 企业认领 |
| `/submit` | 提交标注 |
| `/admin` | 审核（仅管理员） |

## 管理员

1. 创建管理员（勿把口令写进仓库）：

```powershell
$env:ADMIN_BOOTSTRAP_PASSWORD = "你的强口令至少12位"
$env:ADMIN_USERNAME = "shuangxiu_admin"
node scripts\create-admin-user.cjs
```

2. 口令登录（开发环境可设 `ADMIN_TOKEN`；**生产必须设置**）：

```powershell
$env:ADMIN_TOKEN = "强口令>=16位"
npm start
```

生产未设置 `ADMIN_TOKEN` 时，**口令登录会被拒绝**（不会回退到公开默认值）。

## 数据与备份

- SQLite：`data/app.db`
- 备份：`powershell -File scripts\backup-db.ps1`（`VACUUM INTO` + integrity_check）
- 生产：HTTPS、ICP 备案；反代后可设 `TRUST_PROXY=1` 才信任 X-Forwarded-For

## 安全说明

- 注册永不直接给管理员；保留用户名黑名单
- 写接口要求 `application/json`；同源 Origin 校验
- Cookie：`httpOnly` + `sameSite=lax`，生产 `secure`
- 纠错审核通过会 **UPDATE** 原企业，不新增重复条目
- 注销：评论软删为「已注销」

生产仍须：强 `ADMIN_TOKEN`、HTTPS、备份、合规审查。
