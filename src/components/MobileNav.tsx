"use client";

import { useEffect, useState } from "react";
import Link from "next/link";

type User = { id: string; username: string; role?: string } | null;

export default function MobileNav() {
  const [open, setOpen] = useState(false);
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

  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") setOpen(false);
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open]);

  async function logout() {
    await fetch("/api/auth/logout", {
      method: "POST",
      credentials: "same-origin",
    });
    setUser(null);
    setOpen(false);
    window.location.href = "/";
  }

  const linkClass =
    "flex min-h-11 items-center rounded-md px-3 text-base font-medium text-ink hover:bg-rest-soft hover:text-rest-deep";

  return (
    <div className="relative">
      <button
        type="button"
        className="inline-flex min-h-11 min-w-11 items-center justify-center rounded-md border border-line bg-white px-3 text-sm font-semibold text-ink"
        aria-expanded={open}
        aria-controls="mobile-menu"
        onClick={() => setOpen((v) => !v)}
      >
        {open ? "关闭" : "菜单"}
      </button>

      {open && (
        <>
          <div
            className="fixed inset-0 z-40 bg-ink/30"
            onClick={() => setOpen(false)}
            aria-hidden
          />
          <div
            id="mobile-menu"
            className="absolute right-0 z-50 mt-2 w-56 rounded-lg border border-line bg-white p-2 shadow-lift"
          >
            <Link href="/" className={linkClass} onClick={() => setOpen(false)}>
              门户首页
            </Link>
            <Link href="/sx#directory" className={linkClass} onClick={() => setOpen(false)}>
              企业库
            </Link>
            <Link href="/sx/claim" className={linkClass} onClick={() => setOpen(false)}>
              企业认领
            </Link>
            <Link href="/sx/submit" className={linkClass} onClick={() => setOpen(false)}>
              提交标注
            </Link>

            <div className="my-2 border-t border-line" />

            {loading ? (
              <p className="px-3 py-2 text-sm text-haze">…</p>
            ) : !user ? (
              <>
                <Link href="/login" className={linkClass} onClick={() => setOpen(false)}>
                  登录
                </Link>
                <Link href="/login?mode=register" className={linkClass} onClick={() => setOpen(false)}>
                  注册
                </Link>
              </>
            ) : (
              <>
                <p className="truncate px-3 py-2 text-sm text-haze">{user.username}</p>
                <Link href="/account" className={linkClass} onClick={() => setOpen(false)}>
                  账号
                </Link>
                <Link href="/me/comments" className={linkClass} onClick={() => setOpen(false)}>
                  我的评论
                </Link>
                {user.role === "admin" && (
                  <Link href="/admin" className={linkClass} onClick={() => setOpen(false)}>
                    审核
                  </Link>
                )}
                <button
                  type="button"
                  className={`${linkClass} w-full text-left`}
                  onClick={logout}
                >
                  退出
                </button>
              </>
            )}
          </div>
        </>
      )}
    </div>
  );
}
