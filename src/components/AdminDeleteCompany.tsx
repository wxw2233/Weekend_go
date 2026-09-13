"use client";

import { useEffect, useState } from "react";

export default function AdminDeleteCompany({
  companyId,
  companyName,
}: {
  companyId: string;
  companyName: string;
}) {
  const [isAdmin, setIsAdmin] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    fetch("/api/auth/me", { credentials: "same-origin" })
      .then((r) => r.json())
      .then((d) => setIsAdmin(d.user?.role === "admin"))
      .catch(() => setIsAdmin(false));
  }, []);

  if (!isAdmin) return null;

  async function onDelete() {
    if (!window.confirm(`确定删除「${companyName}」？其评论也会一并删除，不可恢复。`)) {
      return;
    }
    setBusy(true);
    setError("");
    try {
      const res = await fetch(`/api/companies/${companyId}`, {
        method: "DELETE",
        credentials: "same-origin",
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(data.error || "删除失败");
      window.location.href = "/";
    } catch (err) {
      setError(err instanceof Error ? err.message : "删除失败");
      setBusy(false);
    }
  }

  return (
    <div className="flex flex-col items-start gap-2">
      <button
        type="button"
        className="inline-flex min-h-11 items-center justify-center rounded-md border border-danger bg-danger-soft/40 px-4 py-2.5 text-sm font-bold text-danger transition hover:bg-danger hover:text-white disabled:opacity-50"
        onClick={onDelete}
        disabled={busy}
      >
        {busy ? "删除中…" : "删除企业"}
      </button>
      {error && <p className="text-xs font-medium text-caution">{error}</p>}
    </div>
  );
}
