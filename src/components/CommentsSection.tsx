"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import Link from "next/link";

type CommentItem = {
  id: string;
  username: string;
  userId?: string;
  content: string;
  createdAt: string;
  parentId: string | null;
  replyToUsername: string | null;
  likeCount: number;
  likedByMe: boolean;
};

type User = { id: string; username: string; role?: string } | null;

function formatTime(iso: string) {
  try {
    return new Date(iso).toLocaleString("zh-CN", {
      month: "2-digit",
      day: "2-digit",
      hour: "2-digit",
      minute: "2-digit",
    });
  } catch {
    return iso.slice(0, 16);
  }
}

function Avatar({
  name,
  size = "md",
}: {
  name: string;
  size?: "md" | "sm";
}) {
  const ch = name.trim().slice(0, 1).toUpperCase() || "?";
  return (
    <span
      aria-hidden
      className={[
        "flex shrink-0 items-center justify-center rounded-full bg-rest font-bold text-white",
        size === "md" ? "h-9 w-9 text-sm" : "h-6 w-6 text-[11px]",
      ].join(" ")}
    >
      {ch}
    </span>
  );
}

function LikeButton({
  companyId,
  commentId,
  liked,
  count,
  loggedIn,
  onToggle,
}: {
  companyId: string;
  commentId: string;
  liked: boolean;
  count: number;
  loggedIn: boolean;
  onToggle: (nextLiked: boolean, nextCount: number) => void;
}) {
  const [busy, setBusy] = useState(false);

  async function toggle() {
    if (!loggedIn) {
      window.location.href = "/login";
      return;
    }
    if (busy) return;
    setBusy(true);
    try {
      const res = await fetch(
        `/api/companies/${companyId}/comments/${commentId}/like`,
        { method: "POST", credentials: "same-origin" },
      );
      const data = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(data.error || "点赞失败");
      onToggle(Boolean(data.liked), Number(data.likeCount) || 0);
    } catch {
      // ignore network flake; user can retry
    } finally {
      setBusy(false);
    }
  }

  return (
    <button
      type="button"
      className={[
        "inline-flex min-h-8 items-center gap-1 rounded-md px-2 text-xs font-bold transition",
        liked
          ? "bg-rest text-white"
          : "bg-paper text-haze hover:bg-rest-soft hover:text-rest-deep",
      ].join(" ")}
      onClick={toggle}
      disabled={busy}
      aria-pressed={liked}
    >
      <span aria-hidden>{liked ? "♥" : "♡"}</span>
      <span>{count > 0 ? count : "赞"}</span>
    </button>
  );
}

function buildThreads(items: CommentItem[]) {
  const byId = new Map(items.map((c) => [c.id, c]));

  function resolveRoot(c: CommentItem): string {
    let cur: CommentItem | undefined = c;
    const seen = new Set<string>();
    while (cur?.parentId && byId.has(cur.parentId) && !seen.has(cur.id)) {
      seen.add(cur.id);
      cur = byId.get(cur.parentId);
    }
    return cur?.id ?? c.id;
  }

  const roots: CommentItem[] = [];
  const repliesByRoot = new Map<string, CommentItem[]>();

  for (const c of items) {
    const rootId = resolveRoot(c);
    if (rootId === c.id) {
      roots.push(c);
      continue;
    }
    const list = repliesByRoot.get(rootId) || [];
    list.push(c);
    repliesByRoot.set(rootId, list);
  }

  roots.sort((a, b) => b.createdAt.localeCompare(a.createdAt));
  for (const list of repliesByRoot.values()) {
    list.sort((a, b) => a.createdAt.localeCompare(b.createdAt));
  }

  return { roots, repliesByRoot };
}

type ReplyBoxProps = {
  companyId: string;
  user: User;
  threadRootId: string;
  replyTo: CommentItem;
  onDone: () => Promise<void> | void;
  onCancel: () => void;
};

function InlineReplyBox({
  companyId,
  user,
  threadRootId,
  replyTo,
  onDone,
  onCancel,
}: ReplyBoxProps) {
  const [content, setContent] = useState("");
  const [posting, setPosting] = useState(false);
  const [error, setError] = useState("");
  const ref = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    ref.current?.focus();
  }, [replyTo.id]);

  if (!user) {
    return (
      <div className="mt-2 rounded-md border border-line bg-paper px-3 py-2 text-sm text-haze">
        <Link href="/login" className="font-semibold text-rest hover:underline">
          登录
        </Link>
        后可以回复
      </div>
    );
  }

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    if (!content.trim()) return;
    setPosting(true);
    setError("");
    try {
      const res = await fetch(`/api/companies/${companyId}/comments`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "same-origin",
        body: JSON.stringify({
          content,
          parentId: threadRootId || replyTo.id,
        }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(data.error || "回复失败");
      setContent("");
      await onDone();
      onCancel();
    } catch (err) {
      setError(err instanceof Error ? err.message : "回复失败");
    } finally {
      setPosting(false);
    }
  }

  return (
    <form
      className="mt-2 rounded-lg border border-rest/35 bg-rest-soft/40 p-2.5"
      onSubmit={submit}
    >
      <p className="mb-1.5 text-xs font-semibold text-rest-deep">
        回复 @{replyTo.username}
      </p>
      <textarea
        ref={ref}
        className="field min-h-[72px] !bg-white"
        placeholder={`回复 @${replyTo.username}…`}
        value={content}
        onChange={(e) => setContent(e.target.value)}
        maxLength={500}
      />
      <div className="mt-2 flex items-center justify-between gap-2">
        <button
          type="button"
          className="text-xs font-semibold text-haze hover:text-ink"
          onClick={onCancel}
        >
          取消
        </button>
        <button
          type="submit"
          className="btn-primary !min-h-9 px-3 !text-xs"
          disabled={posting || content.trim().length < 2}
        >
          {posting ? "发送中…" : "发送"}
        </button>
      </div>
      {error && <p className="mt-1 text-xs font-medium text-caution">{error}</p>}
    </form>
  );
}

export default function CommentsSection({ companyId }: { companyId: string }) {
  const [items, setItems] = useState<CommentItem[]>([]);
  const [user, setUser] = useState<User>(null);
  const [content, setContent] = useState("");
  const [replyTarget, setReplyTarget] = useState<CommentItem | null>(null);
  const [loading, setLoading] = useState(true);
  const [posting, setPosting] = useState(false);
  const [error, setError] = useState("");
  const [page, setPage] = useState(1);
  const [total, setTotal] = useState(0);
  const [hasMore, setHasMore] = useState(false);

  const load = useCallback(
    async (p: number) => {
      try {
        const res = await fetch(
          `/api/companies/${companyId}/comments?page=${p}&pageSize=10`,
          { credentials: "same-origin" },
        );
        const data = await res.json();
        setItems(
          (data.items || []).map(
            (c: Partial<CommentItem> & { id: string }): CommentItem => ({
              id: c.id,
              username: c.username || "",
              userId: c.userId,
              content: c.content || "",
              createdAt: c.createdAt || "",
              parentId: c.parentId ?? null,
              replyToUsername: c.replyToUsername ?? null,
              likeCount: Number(c.likeCount) || 0,
              likedByMe: Boolean(c.likedByMe),
            }),
          ),
        );
        setTotal(Number(data.total) || 0);
        setHasMore(Boolean(data.hasMore));
      } catch {
        setItems([]);
      } finally {
        setLoading(false);
      }
    },
    [companyId],
  );

  useEffect(() => {
    load(page);
    fetch("/api/auth/me", { credentials: "same-origin" })
      .then((r) => r.json())
      .then((d) => setUser(d.user ?? null))
      .catch(() => setUser(null));
  }, [load, page]);

  const { roots, repliesByRoot } = useMemo(() => buildThreads(items), [items]);

  function patchLike(id: string, liked: boolean, likeCount: number) {
    setItems((list) =>
      list.map((c) => (c.id === id ? { ...c, likedByMe: liked, likeCount } : c)),
    );
  }

  async function removeComment(id: string) {
    if (!window.confirm("删除这条评论？回复也会一起消失。")) return;
    try {
      const res = await fetch(`/api/companies/${companyId}/comments/${id}`, {
        method: "DELETE",
        credentials: "same-origin",
      });
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data.error || "删除失败");
      }
      await load(page);
    } catch (err) {
      alert(err instanceof Error ? err.message : "删除失败");
    }
  }

  function canDelete(c: CommentItem) {
    if (!user) return false;
    if (user.role === "admin") return true;
    return Boolean(c.userId) && c.userId === user.id;
  }

  async function onPostMain(e: React.FormEvent) {
    e.preventDefault();
    if (!content.trim()) return;
    setPosting(true);
    setError("");
    try {
      const res = await fetch(`/api/companies/${companyId}/comments`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "same-origin",
        body: JSON.stringify({ content }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(data.error || "评论失败");
      setContent("");
      setPage(1);
      await load(1);
    } catch (err) {
      setError(err instanceof Error ? err.message : "评论失败");
    } finally {
      setPosting(false);
    }
  }

  return (
    <section className="mt-6 rounded-lg border border-line bg-white p-4 sm:p-5">
      <div className="flex items-center justify-between gap-2">
        <h2 className="text-lg font-bold text-ink">评论</h2>
        <span className="text-sm text-haze">{total} 条</span>
      </div>

      {user ? (
        <form className="mt-4 space-y-2" onSubmit={onPostMain}>
          <textarea
            className="field min-h-20"
            placeholder="说说你知道的情况…点楼层下的「回复」可就地回复"
            value={content}
            onChange={(e) => setContent(e.target.value)}
            maxLength={500}
          />
          <div className="flex items-center justify-between gap-2">
            <p className="text-xs font-medium text-haze">
              以 <span className="text-rest-deep">{user.username}</span> 发表新评论
            </p>
            <button
              type="submit"
              className="btn-primary !min-h-10 px-4"
              disabled={posting || content.trim().length < 2}
            >
              {posting ? "发送中…" : "发表"}
            </button>
          </div>
          {error && <p className="text-sm font-medium text-caution">{error}</p>}
        </form>
      ) : (
        <p className="mt-4 rounded-lg bg-paper px-3 py-3 text-sm text-haze">
          <Link href="/login" className="font-semibold text-rest hover:underline">
            登录
          </Link>
          后可以参与讨论
        </p>
      )}

      <div className="mt-5 space-y-4">
        {loading ? (
          <p className="text-sm text-haze">加载评论…</p>
        ) : roots.length === 0 ? (
          <p className="rounded-lg border border-dashed border-line px-3 py-8 text-center text-sm text-haze">
            还没有评论，来抢沙发
          </p>
        ) : (
          roots.map((c) => {
            const replies = repliesByRoot.get(c.id) || [];
            return (
              <article
                key={c.id}
                className="overflow-hidden rounded-xl border border-line shadow-sm"
              >
                <div className="bg-[#FBF9F4] px-4 py-4">
                  <div className="flex items-start gap-3">
                    <Avatar name={c.username} />
                    <div className="min-w-0 flex-1">
                      <div className="flex flex-wrap items-baseline justify-between gap-x-2">
                        <p className="truncate text-base font-bold leading-tight text-ink">
                          {c.username}
                        </p>
                        <time className="font-mono text-[11px] text-haze">
                          {formatTime(c.createdAt)}
                        </time>
                      </div>
                      <p className="mt-2 whitespace-pre-wrap break-words text-[15px] leading-relaxed text-ink">
                        {c.content}
                      </p>
                      <div className="mt-2.5 flex flex-wrap items-center gap-2">
                        <button
                          type="button"
                          className="text-xs font-bold text-rest hover:underline"
                          onClick={() => setReplyTarget(c)}
                        >
                          回复
                        </button>
                        <LikeButton
                          companyId={companyId}
                          commentId={c.id}
                          liked={c.likedByMe}
                          count={c.likeCount}
                          loggedIn={Boolean(user)}
                          onToggle={(liked, count) => patchLike(c.id, liked, count)}
                        />
                        {canDelete(c) && (
                          <button
                            type="button"
                            className="text-xs font-bold text-haze hover:text-caution"
                            onClick={() => removeComment(c.id)}
                          >
                            删除
                          </button>
                        )}
                        {replies.length > 0 && (
                          <span className="text-xs text-haze">
                            {replies.length} 条回复
                          </span>
                        )}
                      </div>

                      {replyTarget?.id === c.id && (
                        <InlineReplyBox
                          companyId={companyId}
                          user={user}
                          threadRootId={c.id}
                          replyTo={c}
                          onDone={() => load(page)}
                          onCancel={() => setReplyTarget(null)}
                        />
                      )}
                    </div>
                  </div>
                </div>

                {replies.length > 0 && (
                  <ul className="border-t-2 border-rest/15 bg-white">
                    {replies.map((r) => (
                      <li
                        key={r.id}
                        className="border-b border-line/80 last:border-b-0"
                      >
                        <div className="border-l-4 border-rest/45 bg-rest-soft/20 px-3 py-3 sm:pl-4">
                          <div className="flex gap-2.5">
                            <Avatar name={r.username} size="sm" />
                            <div className="min-w-0 flex-1">
                              <div className="flex flex-wrap items-baseline justify-between gap-x-2">
                                <p className="truncate text-[13px] font-bold text-ink">
                                  {r.username}
                                </p>
                                <time className="font-mono text-[11px] text-haze">
                                  {formatTime(r.createdAt)}
                                </time>
                              </div>
                              {r.replyToUsername && (
                                <p className="mt-0.5 text-[12px] font-semibold text-rest">
                                  回复 @{r.replyToUsername}
                                </p>
                              )}
                              <p className="mt-1.5 whitespace-pre-wrap break-words text-sm leading-relaxed text-ink">
                                {r.content}
                              </p>
                              <div className="mt-1.5 flex flex-wrap items-center gap-2">
                                <button
                                  type="button"
                                  className="text-xs font-bold text-rest hover:underline"
                                  onClick={() => setReplyTarget(r)}
                                >
                                  回复
                                </button>
                                <LikeButton
                                  companyId={companyId}
                                  commentId={r.id}
                                  liked={r.likedByMe}
                                  count={r.likeCount}
                                  loggedIn={Boolean(user)}
                                  onToggle={(liked, count) =>
                                    patchLike(r.id, liked, count)
                                  }
                                />
                                {canDelete(r) && (
                                  <button
                                    type="button"
                                    className="text-xs font-bold text-haze hover:text-caution"
                                    onClick={() => removeComment(r.id)}
                                  >
                                    删除
                                  </button>
                                )}
                              </div>

                              {replyTarget?.id === r.id && (
                                <InlineReplyBox
                                  companyId={companyId}
                                  user={user}
                                  threadRootId={c.id}
                                  replyTo={r}
                                  onDone={() => load(page)}
                                  onCancel={() => setReplyTarget(null)}
                                />
                              )}
                            </div>
                          </div>
                        </div>
                      </li>
                    ))}
                  </ul>
                )}
              </article>
            );
          })
        )}
      </div>

      {(page > 1 || hasMore) && (
        <nav
          className="mt-4 flex items-center justify-center gap-3"
          aria-label="评论分页"
        >
          <button
            type="button"
            className="btn-ghost !min-h-9 px-3 !text-xs"
            disabled={page <= 1 || loading}
            onClick={() => setPage((p) => Math.max(1, p - 1))}
          >
            上一页
          </button>
          <span className="text-xs font-medium text-haze">第 {page} 页</span>
          <button
            type="button"
            className="btn-ghost !min-h-9 px-3 !text-xs"
            disabled={!hasMore || loading}
            onClick={() => setPage((p) => p + 1)}
          >
            下一页
          </button>
        </nav>
      )}
    </section>
  );
}
