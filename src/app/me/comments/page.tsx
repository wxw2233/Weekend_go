"use client";

import Link from "next/link";
import { useEffect, useState } from "react";

type Item = {
  id: string;
  companyId: string;
  companyName: string;
  content: string;
  createdAt: string;
  likeCount: number;
  parentId: string | null;
};

function formatTime(iso: string) {
  try {
    return new Date(iso).toLocaleString("zh-CN");
  } catch {
    return iso;
  }
}

export default function MyCommentsPage() {
  const [items, setItems] = useState<Item[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [authed, setAuthed] = useState(false);

  useEffect(() => {
    fetch("/api/auth/me", { credentials: "same-origin" })
      .then((r) => r.json())
      .then((d) => {
        if (!d.user) {
          window.location.href = "/login";
          return;
        }
        setAuthed(true);
        return fetch("/api/me/comments", { credentials: "same-origin" });
      })
      .then(async (r) => {
        if (!r) return;
        const data = await r.json();
        setItems(data.items || []);
      })
      .catch(() => setError("加载失败"))
      .finally(() => setLoading(false));
  }, []);

  if (!authed && !error) {
    return (
      <div className="container-page py-16 text-sm text-haze">检查登录…</div>
    );
  }

  return (
    <div className="container-page max-w-2xl py-10">
      <div className="flex items-center justify-between gap-2">
        <h1 className="text-xl font-bold text-ink">我的评论</h1>
        <Link href="/account" className="text-sm font-medium text-haze hover:text-rest">
          账号设置
        </Link>
      </div>

      {error && <p className="mt-4 text-sm text-caution">{error}</p>}

      {loading ? (
        <p className="mt-6 text-sm text-haze">加载中…</p>
      ) : items.length === 0 ? (
        <div className="mt-6 rounded-lg border border-dashed border-line bg-white px-4 py-12 text-center">
          <p className="text-sm font-semibold text-ink">还没有评论</p>
          <Link href="/sx#directory" className="btn-primary mt-4">
            去企业库看看
          </Link>
        </div>
      ) : (
        <ul className="mt-5 space-y-3">
          {items.map((c) => (
            <li
              key={c.id}
              className="rounded-lg border border-line bg-white p-4"
            >
              <div className="flex flex-wrap items-baseline justify-between gap-2">
                <Link
                  href={`/sx/companies/${c.companyId}`}
                  className="font-semibold text-rest hover:underline"
                >
                  {c.companyName}
                </Link>
                <span className="font-mono text-[11px] text-haze">
                  {formatTime(c.createdAt)}
                </span>
              </div>
              <p className="mt-2 whitespace-pre-wrap break-words text-sm leading-relaxed text-ink">
                {c.parentId ? "（回复）" : ""}
                {c.content}
              </p>
              <p className="mt-2 text-xs text-haze">赞 {c.likeCount}</p>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
