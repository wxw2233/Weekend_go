"use client";

import { useEffect, useState } from "react";
import Link from "next/link";

type User = { id: string; username: string; role?: string } | null;

export default function AuthNav() {
  const [user, setUser] = useState<User>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    fetch("/api/auth/me", { credentials: "same-origin" })
      .then((r) => r.json())
      .then((data) => {
        if (!cancelled) setUser(data.user ?? null);
      })
      .catch(() => {
        if (!cancelled) setUser(null);
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, []);

  async function logout() {
    await fetch("/api/auth/logout", {
      method: "POST",
      credentials: "same-origin",
    });
    setUser(null);
    window.location.href = "/";
  }

  if (loading) {
    return <span className="px-2 text-sm text-haze">…</span>;
  }

  if (!user) {
    return (
      <>
        <Link
          href="/login"
          className="min-h-10 px-2.5 py-2 font-medium text-ink hover:text-rest"
        >
          登录
        </Link>
        <Link href="/login?mode=register" className="btn-primary ml-1 !min-h-10 px-3">
          注册
        </Link>
      </>
    );
  }

  return (
    <>
      <span className="hidden max-w-[8rem] truncate px-2 text-sm text-haze lg:inline">
        {user.username}
      </span>
      <Link
        href="/account"
        className="min-h-10 px-2.5 py-2 font-medium text-ink hover:text-rest"
      >
        账号
      </Link>
      {user.role === "admin" && (
        <Link
          href="/admin"
          className="min-h-10 px-2.5 py-2 font-medium text-ink hover:text-rest"
        >
          审核
        </Link>
      )}
      <button type="button" className="btn-ghost ml-1 !min-h-10 px-3" onClick={logout}>
        退出
      </button>
    </>
  );
}
