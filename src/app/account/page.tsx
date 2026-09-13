"use client";

import Link from "next/link";
import { useEffect, useState } from "react";

type User = {
  id: string;
  username: string;
  role?: string;
} | null;

export default function AccountPage() {
  const [user, setUser] = useState<User>(null);
  const [loading, setLoading] = useState(true);
  const [oldPassword, setOldPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [pwdMsg, setPwdMsg] = useState("");
  const [pwdOk, setPwdOk] = useState(false);
  const [pwdBusy, setPwdBusy] = useState(false);
  const [delPassword, setDelPassword] = useState("");
  const [delMsg, setDelMsg] = useState("");
  const [delBusy, setDelBusy] = useState(false);

  useEffect(() => {
    fetch("/api/auth/me", { credentials: "same-origin" })
      .then((r) => r.json())
      .then((d) => setUser(d.user ?? null))
      .catch(() => setUser(null))
      .finally(() => setLoading(false));
  }, []);

  useEffect(() => {
    if (!loading && !user) window.location.href = "/login";
  }, [loading, user]);

  async function changePassword(e: React.FormEvent) {
    e.preventDefault();
    setPwdMsg("");
    setPwdOk(false);
    if (newPassword !== confirm) {
      setPwdMsg("两次输入的新密码不一致");
      return;
    }
    setPwdBusy(true);
    try {
      const res = await fetch("/api/auth/password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "same-origin",
        body: JSON.stringify({ oldPassword, newPassword }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(data.error || "修改失败");
      setPwdOk(true);
      setPwdMsg("密码已修改，需重新登录");
      setOldPassword("");
      setNewPassword("");
      setConfirm("");
      await fetch("/api/auth/logout", { method: "POST", credentials: "same-origin" });
      setTimeout(() => {
        window.location.href = "/login";
      }, 1200);
    } catch (err) {
      setPwdMsg(err instanceof Error ? err.message : "修改失败");
    } finally {
      setPwdBusy(false);
    }
  }

  async function deleteAccount(e: React.FormEvent) {
    e.preventDefault();
    if (!window.confirm("注销后账号不可恢复，评论将显示为「已注销」。确定继续？")) {
      return;
    }
    setDelMsg("");
    setDelBusy(true);
    try {
      const res = await fetch("/api/auth/delete-account", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "same-origin",
        body: JSON.stringify({ password: delPassword }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(data.error || "注销失败");
      window.location.href = "/";
    } catch (err) {
      setDelMsg(err instanceof Error ? err.message : "注销失败");
      setDelBusy(false);
    }
  }

  if (loading || !user) {
    return (
      <div className="container-page py-16 text-sm text-haze">加载中…</div>
    );
  }

  return (
    <div className="container-page max-w-xl py-10">
      <h1 className="text-xl font-bold text-ink">账号</h1>
      <p className="mt-1 text-sm text-haze">
        {user.username}
        {user.role === "admin" ? " · 管理员" : ""}
      </p>

      <div className="mt-3 flex flex-wrap gap-2">
        <Link href="/me/comments" className="btn-ghost !min-h-10 px-3">
          我的评论
        </Link>
      </div>

      <section className="mt-8 rounded-lg border border-line bg-white p-5">
        <h2 className="text-base font-bold text-ink">修改密码</h2>
        <form className="mt-4 space-y-3" onSubmit={changePassword}>
          <div>
            <label className="label" htmlFor="oldPassword">
              当前密码
            </label>
            <input
              id="oldPassword"
              type="password"
              className="field"
              value={oldPassword}
              onChange={(e) => setOldPassword(e.target.value)}
              required
              autoComplete="current-password"
            />
          </div>
          <div>
            <label className="label" htmlFor="newPassword">
              新密码
            </label>
            <input
              id="newPassword"
              type="password"
              className="field"
              value={newPassword}
              onChange={(e) => setNewPassword(e.target.value)}
              required
              autoComplete="new-password"
            />
          </div>
          <div>
            <label className="label" htmlFor="confirmPwd">
              确认新密码
            </label>
            <input
              id="confirmPwd"
              type="password"
              className="field"
              value={confirm}
              onChange={(e) => setConfirm(e.target.value)}
              required
              autoComplete="new-password"
            />
          </div>
          {pwdMsg && (
            <p className={`text-sm font-medium ${pwdOk ? "text-rest" : "text-caution"}`}>
              {pwdMsg}
            </p>
          )}
          <button type="submit" className="btn-primary" disabled={pwdBusy}>
            {pwdBusy ? "提交中…" : "修改密码"}
          </button>
        </form>
      </section>

      {user.role !== "admin" && (
        <section className="mt-6 rounded-lg border border-danger/40 bg-danger-soft/30 p-5">
          <h2 className="text-base font-bold text-ink">注销账号</h2>
          <p className="mt-1 text-sm text-haze">
            将删除账号与点赞；已有评论会保留但显示为「已注销」，回复链不断开。
          </p>
          <form className="mt-4 space-y-3" onSubmit={deleteAccount}>
            <div>
              <label className="label" htmlFor="delPassword">
                输入密码确认
              </label>
              <input
                id="delPassword"
                type="password"
                className="field"
                value={delPassword}
                onChange={(e) => setDelPassword(e.target.value)}
                required
              />
            </div>
            {delMsg && (
              <p className="text-sm font-medium text-caution">{delMsg}</p>
            )}
            <button type="submit" className="btn-ghost border-danger text-danger" disabled={delBusy}>
              {delBusy ? "注销中…" : "确认注销"}
            </button>
          </form>
        </section>
      )}
    </div>
  );
}
