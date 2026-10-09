import Link from "next/link";

export default function LoginGate({
  next,
  title = "本操作需要登录",
  description,
}: {
  next: string;
  title?: string;
  description: string;
}) {
  return (
    <div className="rounded-lg border border-dashed border-line bg-rest-soft/40 p-8 text-center">
      <p className="text-base font-semibold text-ink">{title}</p>
      <p className="mx-auto mt-2 max-w-md text-sm leading-6 text-haze">
        {description}
      </p>
      <div className="mt-5">
        <Link
          href={`/login?next=${encodeURIComponent(next)}`}
          className="inline-flex min-h-11 items-center rounded-md bg-rest px-6 text-sm font-bold text-white transition hover:bg-rest-deep"
        >
          登录 / 注册
        </Link>
      </div>
      <p className="mt-3 text-xs text-haze">
        已有账号直接登录即可继续 · 未登录时所有内容仍可正常浏览
      </p>
    </div>
  );
}
