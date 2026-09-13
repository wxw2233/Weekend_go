"use client";

export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <div className="container-page flex min-h-[50vh] flex-col items-center justify-center py-16 text-center">
      <p className="font-mono text-xs font-bold uppercase tracking-[0.16em] text-caution">
        出错了
      </p>
      <h1 className="mt-2 text-xl font-bold text-ink">页面加载失败</h1>
      <p className="mt-2 max-w-md text-sm text-haze">
        {error?.message || "发生了未知错误"}
      </p>
      <button type="button" className="btn-primary mt-6" onClick={reset}>
        重试
      </button>
    </div>
  );
}
