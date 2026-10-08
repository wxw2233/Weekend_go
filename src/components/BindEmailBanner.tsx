"use client";

import { useEffect, useState } from "react";

type MeUser = { id: string; username: string; email?: string | null } | null;

const DISMISS_KEY = "sx_bind_email_dismiss_until";
const DISMISS_DAYS = 7;

export default function BindEmailBanner() {
  const [show, setShow] = useState(false);
  const [open, setOpen] = useState(false);
  const [email, setEmail] = useState("");
  const [emailCode, setEmailCode] = useState("");
  const [sending, setSending] = useState(false);
  const [countdown, setCountdown] = useState(0);
  const [error, setError] = useState("");
  const [done, setDone] = useState(false);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    let cancelled = false;
    fetch("/api/auth/me", { credentials: "same-origin" })
      .then((r) => r.json())
      .then((data) => {
        if (cancelled) return;
        const user: MeUser = data.user ?? null;
        if (user && !user.email) {
          const until = Number(localStorage.getItem(DISMISS_KEY) || 0);
          if (Date.now() > until) setShow(true);
        }
      })
      .catch(() => {});
    return () => {
      cancelled = true;
    };
  }, []);

  useEffect(() => {
    if (countdown <= 0) return;
    const t = setTimeout(() => setCountdown((c) => c - 1), 1000);
    return () => clearTimeout(t);
  }, [countdown]);

  function dismiss() {
    setShow(false);
    try {
      localStorage.setItem(
        DISMISS_KEY,
        String(Date.now() + DISMISS_DAYS * 24 * 3600 * 1000),
      );
    } catch {}
  }

  async function sendCode() {
    setError("");
    if (!email.trim()) {
      setError("请先输入邮箱");
      return;
    }
    setSending(true);
    try {
      const res = await fetch("/api/auth/email-code", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "same-origin",
        body: JSON.stringify({ email: email.trim(), scene: "bind" }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(data.error || "验证码发送失败");
      setCountdown(60);
    } catch (err) {
      setError(err instanceof Error ? err.message : "验证码发送失败");
    } finally {
      setSending(false);
    }
  }

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    if (!emailCode.trim()) {
      setError("请输入邮箱验证码");
      return;
    }
    setLoading(true);
    try {
      const res = await fetch("/api/auth/bind-email", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "same-origin",
        body: JSON.stringify({ email: email.trim(), emailCode: emailCode.trim() }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(data.error || "绑定失败");
      setDone(true);
      setTimeout(() => window.location.reload(), 1500);
    } catch (err) {
      setError(err instanceof Error ? err.message : "绑定失败");
      setLoading(false);
    }
  }

  if (!show) return null;

  return (
    <div className="border-b border-line bg-[#F3F0E8]">
      <div className="container-page py-2.5 text-sm">
        {done ? (
          <p className="text-center font-medium text-rest">
            邮箱绑定成功，稍后自动刷新…
          </p>
        ) : open ? (
          <form
            className="flex flex-col gap-2 sm:flex-row sm:items-center"
            onSubmit={submit}
          >
            <span className="shrink-0 font-medium text-ink">绑定邮箱：</span>
            <input
              type="email"
              className="field !min-h-9 flex-1 !py-1"
              placeholder="邮箱地址"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              autoComplete="email"
            />
            <input
              className="field !min-h-9 w-full !py-1 sm:w-32"
              placeholder="6 位验证码"
              value={emailCode}
              onChange={(e) => setEmailCode(e.target.value.replace(/\D/g, ""))}
              required
              maxLength={6}
              inputMode="numeric"
              autoComplete="one-time-code"
            />
            <div className="flex shrink-0 gap-2">
              <button
                type="button"
                className="min-h-9 rounded-md border border-line bg-white px-3 text-xs font-semibold text-ink disabled:opacity-50"
                onClick={sendCode}
                disabled={sending || countdown > 0}
              >
                {countdown > 0 ? `${countdown}s` : sending ? "发送中…" : "发验证码"}
              </button>
              <button
                type="submit"
                className="min-h-9 rounded-md bg-rest px-3 text-xs font-semibold text-white disabled:opacity-50"
                disabled={loading}
              >
                {loading ? "绑定中…" : "绑定"}
              </button>
              <button
                type="button"
                className="min-h-9 px-2 text-xs text-haze hover:text-ink"
                onClick={() => setOpen(false)}
              >
                收起
              </button>
            </div>
            {error && <p className="text-xs font-medium text-caution">{error}</p>}
          </form>
        ) : (
          <div className="flex flex-wrap items-center justify-center gap-x-3 gap-y-1 text-center sm:justify-between">
            <p className="text-ink">
              绑定邮箱后即可自助找回密码，
              <span className="text-haze">
                老账号建议尽快补绑，仅提示这一次可随时关闭
              </span>
            </p>
            <div className="flex shrink-0 items-center gap-2">
              <button
                type="button"
                className="min-h-8 rounded-md bg-rest px-3 text-xs font-semibold text-white"
                onClick={() => setOpen(true)}
              >
                立即绑定
              </button>
              <button
                type="button"
                className="min-h-8 px-2 text-xs text-haze hover:text-ink"
                onClick={dismiss}
                aria-label="关闭提示"
              >
                暂不 ✕
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
