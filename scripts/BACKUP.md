# 双休go! 数据备份

备份 SQLite 数据库到 `backups/` 目录。

## 用法（PowerShell）

```powershell
# 在项目根目录执行
powershell -File scripts\backup-db.ps1
```

会复制 `data/app.db` 为 `backups/app-YYYYMMDD-HHMMSS.db`，并保留最近 20 份。

## 生产环境注意

1. 设置环境变量 `ADMIN_TOKEN`（不要用开发默认口令）
2. 定时备份 `data/app.db`（可用计划任务每日执行本脚本）
3. `public/images/worker-poster.webp` 为静态资源，可一并备份
4. 上线前完成 ICP 备案与 HTTPS
