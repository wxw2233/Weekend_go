"use client";

import Link from "next/link";
import { useEffect, useState } from "react";

export default function ForgotPasswordPage() {
  const [stage, setStage] = useState<"send" | "reset">("send");
  const [email, setEmail] = useState("");
  const [emailCode, setEmailCode] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [sending, setSending] = useState(false);
  const [countdown, setCountdown] = useState(0);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [done, setDone] = useState(false);

  useEffect(() => {
    if (countdown <= 0) return;
    const t = setTimeout(() => setCountdown((c) => c - 1), 1000);
    return () => clearTimeout(t);
  }, [countdown]);

  async function sendCode() {
    setError("");
    if (!email.trim()) {
      setError("请输入注册时的邮箱");
      return;
    }
    setSending(true);
    try {
      const res = await fetch("/api/auth/email-code", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "same-origin",
        body: JSON.stringify({ email: email.trim(), scene: "reset" }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(data.error || "验证码发送失败");
      setCountdown(60);
      setStage("reset");
    } catch (err) {
      setError(err instanceof Error ? err.message : "验证码发送失败");
    } finally {
      setSending(false);
    }
  }

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    if (newPassword !== confirm) {
      setError("两次输入的密码不一致");
      return;
    }
    setLoading(true);
    try {
      const res = await fetch("/api/auth/reset-password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "same-origin",
        body: JSON.stringify({
          email: email.trim(),
          emailCode: emailCode.trim(),
          newPassword,
        }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(data.error || "重置失败");
      setDone(true);
    } catch (err) {
      setError(err instanceof Error ? err.message : "重置失败");
      setLoading(false);
    }
  }

  return (
    <div className="container-page max-w-md py-10">
      <h1 className="text-xl font-bold text-ink">找回密码</h1>

      {done ? (
        <div className="mt-4 space-y-4 rounded-lg border border-line bg-white p-5">
          <p className="text-sm text-ink">
            密码已重置，请用新密码登录。所有已登录设备将被强制下线。
          </p>
          <Link href="/login" className="btn-primary block w-full text-center">
            去登录
          </Link>
        </div>
      ) : (
        <form
          className="mt-4 space-y-4 rounded-lg border border-line bg-white p-5"
          onSubmit={onSubmit}
        >
          <div>
            <label className="label" htmlFor="email">
              注册邮箱
            </label>
            <div className="flex gap-2">
              <input
                id="email"
                type="email"
                className="field flex-1"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                placeholder="注册时填写的邮箱"
                autoComplete="email"
              />
              <button
                type="button"
                className="min-h-11 shrink-0 rounded-md border border-line bg-paper px-3 text-sm font-semibold text-ink disabled:opacity-50"
                onClick={sendCode}
                disabled={sending || countdown > 0}
              >
                {countdown > 0
                  ? `${countdown}s 后重发`
                  : sending
                    ? "发送中…"
                    : stage === "send"
                      ? "发送验证码"
                      : "重发验证码"}
              </button>
            </div>
          </div>

          {stage === "reset" && (
            <>
              <div>
                <label className="label" htmlFor="emailCode">
                  邮箱验证码
                </label>
                <input
                  id="emailCode"
                  className="field"
                  value={emailCode}
                  onChange={(e) =>
                    setEmailCode(e.target.value.replace(/\D/g, ""))
                  }
                  required
                  maxLength={6}
                  inputMode="numeric"
                  placeholder="6 位数字，10 分钟内有效"
                  autoComplete="one-time-code"
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
                  minLength={8}
                  autoComplete="new-password"
                />
                <p className="mt-1 text-xs text-haze">
                  至少 8 位，需同时包含字母和数字
                </p>
              </div>
              <div>
                <label className="label" htmlFor="confirmNew">
                  确认新密码
                </label>
                <input
                  id="confirmNew"
                  type="password"
                  className="field"
                  value={confirm}
                  onChange={(e) => setConfirm(e.target.value)}
                  required
                  autoComplete="new-password"
                />
              </div>
            </>
          )}

          {error && <p className="text-sm font-medium text-caution">{error}</p>}

          {stage === "reset" && (
            <button
              type="submit"
              className="btn-primary w-full"
              disabled={loading}
            >
              {loading ? "请稍候…" : "重置密码"}
            </button>
          )}
        </form>
      )}

      <p className="mt-4 text-center text-sm text-haze">
        <Link href="/login" className="hover:text-rest">
          返回登录
        </Link>
      </p>
    </div>
  );
}
