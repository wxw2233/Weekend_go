"use client";

import Link from "next/link";
import { Suspense, useCallback, useEffect, useState } from "react";
import { useSearchParams } from "next/navigation";

type CaptchaData = { token: string; dataUrl: string };

function LoginForm({
  mode: initialMode,
  next = "",
}: {
  mode: "login" | "register";
  next?: string;
}) {
  const [mode, setMode] = useState(initialMode);
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [website, setWebsite] = useState(""); // honeypot, real users never see it
  const [email, setEmail] = useState("");
  const [emailCode, setEmailCode] = useState("");
  const [sending, setSending] = useState(false);
  const [countdown, setCountdown] = useState(0);
  const [captchaText, setCaptchaText] = useState("");
  const [captcha, setCaptcha] = useState<CaptchaData | null>(null);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (countdown <= 0) return;
    const t = setTimeout(() => setCountdown((c) => c - 1), 1000);
    return () => clearTimeout(t);
  }, [countdown]);

  async function sendEmailCode() {
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
        body: JSON.stringify({ email: email.trim(), scene: "register" }),
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

  const refreshCaptcha = useCallback(async () => {
    setCaptchaText("");
    try {
      const res = await fetch("/api/auth/captcha", { credentials: "same-origin" });
      if (!res.ok) throw new Error("captcha");
      const data = (await res.json()) as CaptchaData;
      setCaptcha(data);
    } catch {
      setCaptcha(null);
    }
  }, []);

  useEffect(() => {
    refreshCaptcha();
  }, [mode, refreshCaptcha]);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");

    if (mode === "register" && password !== confirm) {
      setError("两次输入的密码不一致");
      return;
    }
    if (!captchaText.trim()) {
      setError("请输入验证码");
      return;
    }
    if (!captcha?.token) {
      setError("请先获取验证码");
      return;
    }
    if (mode === "register") {
      if (!email.trim()) {
        setError("请输入邮箱");
        return;
      }
      if (!emailCode.trim()) {
        setError("请输入邮箱验证码");
        return;
      }
    }

    setLoading(true);
    try {
      const body: Record<string, string> = {
        username,
        password,
        captchaText: captchaText.trim(),
        captchaToken: captcha?.token || "",
      };
      if (mode === "register") {
        body.email = email.trim();
        body.emailCode = emailCode.trim();
        body.website = website; // honeypot
      }
      const res = await fetch(
        mode === "login" ? "/api/auth/login" : "/api/auth/register",
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          credentials: "same-origin",
          body: JSON.stringify(body),
        },
      );
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        await refreshCaptcha();
        throw new Error(
          data.error || (mode === "login" ? "登录失败" : "注册失败"),
        );
      }
      window.location.href = next || "/sx";
    } catch (err) {
      setError(err instanceof Error ? err.message : "操作失败");
      setLoading(false);
    }
  }

  return (
    <div className="container-page max-w-md py-10">
      <h1 className="text-xl font-bold text-ink">
        {mode === "login" ? "登录" : "注册"}
      </h1>

      <div className="mt-4 flex gap-2 rounded-lg border border-line bg-white p-1">
        {(["login", "register"] as const).map((m) => (
          <button
            key={m}
            type="button"
            className={`min-h-10 flex-1 rounded-md text-sm font-semibold transition ${
              mode === m ? "bg-rest text-white" : "text-haze hover:text-ink"
            }`}
            onClick={() => {
              setMode(m);
              setError("");
            }}
          >
            {m === "login" ? "登录" : "注册"}
          </button>
        ))}
      </div>

      <form
        className="mt-4 space-y-4 rounded-lg border border-line bg-white p-5"
        onSubmit={onSubmit}
      >
        <div>
          <label className="label" htmlFor="username">
            用户名
          </label>
          <input
            id="username"
            className="field"
            value={username}
            onChange={(e) => setUsername(e.target.value)}
            required
            autoFocus
            autoComplete="username"
          />
        </div>
        <div>
          <label className="label" htmlFor="password">
            密码
          </label>
          <input
            id="password"
            type="password"
            className="field"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
            minLength={mode === "register" ? 8 : undefined}
            autoComplete={mode === "login" ? "current-password" : "new-password"}
          />
          {mode === "register" && (
            <p className="mt-1 text-xs text-haze">
              至少 8 位，需同时包含字母和数字
            </p>
          )}
        </div>
        {mode === "register" && (
          <div>
            <label className="label" htmlFor="confirm">
              确认密码
            </label>
            <input
              id="confirm"
              type="password"
              className="field"
              value={confirm}
              onChange={(e) => setConfirm(e.target.value)}
              required
              autoComplete="new-password"
            />
          </div>
        )}
        {mode === "register" && (
          <div>
            <label className="label" htmlFor="email">
              邮箱
            </label>
            <div className="flex gap-2">
              <input
                id="email"
                type="email"
                className="field flex-1"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                placeholder="用于验证和找回密码"
                autoComplete="email"
              />
              <button
                type="button"
                className="min-h-11 shrink-0 rounded-md border border-line bg-paper px-3 text-sm font-semibold text-ink disabled:opacity-50"
                onClick={sendEmailCode}
                disabled={sending || countdown > 0}
              >
                {countdown > 0
                  ? `${countdown}s 后重发`
                  : sending
                    ? "发送中…"
                    : "发送验证码"}
              </button>
            </div>
          </div>
        )}
        {mode === "register" && (
          <div>
            <label className="label" htmlFor="emailCode">
              邮箱验证码
            </label>
            <input
              id="emailCode"
              className="field"
              value={emailCode}
              onChange={(e) => setEmailCode(e.target.value.replace(/\D/g, ""))}
              required
              maxLength={6}
              inputMode="numeric"
              placeholder="6 位数字，10 分钟内有效"
              autoComplete="one-time-code"
            />
          </div>
        )}

        {/* Honeypot: hidden from real users; bots autofilling it get silently dropped. */}
        <div className="hidden" aria-hidden="true">
          <label htmlFor="website">网站</label>
          <input
            id="website"
            name="website"
            tabIndex={-1}
            autoComplete="off"
            value={website}
            onChange={(e) => setWebsite(e.target.value)}
          />
        </div>

        <div>
          <label className="label" htmlFor="captcha">
            验证码
          </label>
            <div className="flex gap-2">
              <input
                id="captcha"
                className="field flex-1 uppercase"
                value={captchaText}
                onChange={(e) => setCaptchaText(e.target.value.toUpperCase())}
                placeholder="看图输入 4 位"
                required
                maxLength={4}
                autoComplete="off"
              />
              <button
                type="button"
                className="min-h-11 shrink-0 rounded-md border border-line bg-paper p-0"
                onClick={refreshCaptcha}
                title="换一张"
                aria-label="刷新验证码"
              >
                {captcha?.dataUrl ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img
                    src={captcha.dataUrl}
                    alt="验证码"
                    width={140}
                    height={48}
                    className="block h-[48px] w-[140px] rounded-md"
                  />
                ) : (
                  <span className="block h-[48px] w-[140px] text-center text-xs leading-[48px] text-haze">
                    加载中…
                  </span>
                )}
              </button>
            </div>
            <p className="mt-1 text-xs text-haze">点击图片可更换</p>
          </div>

        {mode === "login" && (
          <p className="-mt-2 text-right text-xs">
            <Link href="/forgot" className="text-haze hover:text-rest">
              忘记密码？
            </Link>
          </p>
        )}

        {error && <p className="text-sm font-medium text-caution">{error}</p>}

        <button type="submit" className="btn-primary w-full" disabled={loading}>
          {loading ? "请稍候…" : mode === "login" ? "登录" : "注册并登录"}
        </button>
      </form>

      <p className="mt-4 text-center text-sm text-haze">
        <Link href="/" className="hover:text-rest">
          返回首页
        </Link>
      </p>
    </div>
  );
}

function LoginInner() {
  const params = useSearchParams();
  const mode = params.get("mode") === "register" ? "register" : "login";
  const rawNext = params.get("next") || "";
  const next =
    rawNext.startsWith("/") && !rawNext.startsWith("//") ? rawNext : "";
  return <LoginForm mode={mode} next={next} />;
}

export default function LoginPage() {
  return (
    <Suspense
      fallback={
        <div className="container-page py-16 text-sm text-haze">加载中…</div>
      }
    >
      <LoginInner />
    </Suspense>
  );
}
