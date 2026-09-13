"use client";

import Link from "next/link";
import { Suspense, useCallback, useEffect, useState } from "react";
import { useSearchParams } from "next/navigation";

type CaptchaData = { token: string; dataUrl: string };

function LoginForm({ mode: initialMode }: { mode: "login" | "register" }) {
  const [mode, setMode] = useState(initialMode);
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [captchaText, setCaptchaText] = useState("");
  const [captcha, setCaptcha] = useState<CaptchaData | null>(null);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

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
    if (mode === "login") refreshCaptcha();
  }, [mode, refreshCaptcha]);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");

    if (mode === "register" && password !== confirm) {
      setError("两次输入的密码不一致");
      return;
    }
    if (mode === "login") {
      if (!captchaText.trim()) {
        setError("请输入验证码");
        return;
      }
      if (!captcha?.token) {
        setError("请先获取验证码");
        return;
      }
    }

    setLoading(true);
    try {
      const body: Record<string, string> = { username, password };
      if (mode === "login") {
        body.captchaText = captchaText.trim();
        body.captchaToken = captcha?.token || "";
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
        if (mode === "login") await refreshCaptcha();
        throw new Error(
          data.error || (mode === "login" ? "登录失败" : "注册失败"),
        );
      }
      window.location.href = "/";
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
            autoComplete={mode === "login" ? "current-password" : "new-password"}
          />
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

        {mode === "login" && (
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
  return <LoginForm mode={mode} />;
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
