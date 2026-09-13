"use client";

import Link from "next/link";
import { useState } from "react";

export default function AdminLoginPage() {
  const [token, setToken] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError("");
    try {
      const res = await fetch("/api/admin/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ token }),
      });
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data.error || "登录失败");
      }
      window.location.href = "/admin";
    } catch (err) {
      setError(err instanceof Error ? err.message : "登录失败");
      setLoading(false);
    }
  }

  return (
    <div className="container-page max-w-md py-16">
      <p className="font-mono text-xs uppercase tracking-[0.18em] text-rest">
        内部工具
      </p>
      <h1 className="mt-2 font-display text-3xl font-bold text-ink">审核后台</h1>
      <p className="mt-3 text-sm leading-relaxed text-haze">
        可用管理员口令登录，也可先
        <Link href="/login" className="mx-1 text-rest underline-offset-2 hover:underline">
          注册账号
        </Link>
        后再进入审核台。会话保存在浏览器 Cookie 中。
      </p>
      <form
        className="mt-8 space-y-4 border border-line bg-white p-6"
        onSubmit={onSubmit}
      >
        <div>
          <label className="label" htmlFor="token">
            管理员口令
          </label>
          <input
            id="token"
            type="password"
            className="field"
            value={token}
            onChange={(e) => setToken(e.target.value)}
            placeholder="ADMIN_TOKEN"
            required
            autoFocus
          />
        </div>
        {error && <p className="text-sm font-medium text-caution">{error}</p>}
        <button type="submit" className="btn-primary w-full" disabled={loading}>
          {loading ? "登录中…" : "登录"}
        </button>
      </form>
    </div>
  );
}
