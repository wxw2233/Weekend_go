"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import AdminDashboard from "@/components/AdminDashboard";

export default function AdminPage() {
  const [state, setState] = useState<"checking" | "ok" | "no-auth" | "no-perm">(
    "checking",
  );

  useEffect(() => {
    let cancelled = false;
    async function check() {
      try {
        const meRes = await fetch("/api/auth/me", { credentials: "same-origin" });
        const me = await meRes.json().catch(() => ({ user: null }));
        const adminRes = await fetch("/api/admin", {
          credentials: "same-origin",
        });
        if (cancelled) return;
        if (adminRes.ok) {
          setState("ok");
        } else if (me?.user) {
          setState("no-perm");
        } else {
          setState("no-auth");
        }
      } catch {
        if (!cancelled) setState("no-auth");
      }
    }
    check();
    return () => {
      cancelled = true;
    };
  }, []);

  useEffect(() => {
    if (state === "no-auth") {
      window.location.href = "/admin/login";
    }
  }, [state]);

  if (state === "checking" || state === "no-auth") {
    return (
      <div className="container-page py-16 text-sm text-haze">检查权限…</div>
    );
  }

  if (state === "no-perm") {
    return (
      <div className="container-page max-w-md py-16">
        <p className="font-mono text-xs uppercase tracking-[0.18em] text-caution">
          无权限
        </p>
        <h1 className="mt-2 font-display text-3xl font-bold text-ink">
          仅管理员可进入
        </h1>
        <p className="mt-3 text-sm leading-relaxed text-haze">
          当前账号是普通用户，不能打开审核台。请使用管理员账号登录。
        </p>
        <div className="mt-8 flex flex-wrap gap-3">
          <Link href="/" className="btn-primary">
            返回首页
          </Link>
          <Link href="/login" className="btn-ghost">
            换账号登录
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="container-page py-12">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <p className="font-mono text-xs uppercase tracking-[0.18em] text-rest">
            内部工具
          </p>
          <h1 className="mt-1 font-display text-3xl font-bold text-ink">
            审核后台
          </h1>
        </div>
        <button
          type="button"
          className="btn-ghost"
          onClick={async () => {
            await fetch("/api/admin/logout", {
              method: "POST",
              credentials: "same-origin",
            });
            await fetch("/api/auth/logout", {
              method: "POST",
              credentials: "same-origin",
            });
            window.location.href = "/login";
          }}
        >
          退出登录
        </button>
      </div>
      <div className="mt-8">
        <AdminDashboard token="" />
      </div>
    </div>
  );
}
