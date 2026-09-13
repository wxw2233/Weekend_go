"use client";

import { useEffect, useState } from "react";
import { REST_TYPES, type RestType } from "@/lib/types";
import RestDayPicker from "@/components/RestDayPicker";
import {
  defaultDaysForRestType,
  validateRestDays,
} from "@/lib/rest-days";

type Props = {
  companyId: string;
  companyName: string;
  defaultRestType: RestType;
  open: boolean;
  onClose: () => void;
};

export default function CorrectModal({
  companyId,
  companyName,
  defaultRestType,
  open,
  onClose,
}: Props) {
  const [restType, setRestType] = useState<RestType>(defaultRestType);
  const [restDays, setRestDays] = useState<number[]>(
    defaultDaysForRestType(defaultRestType),
  );
  const [note, setNote] = useState("");
  const [evidenceNote, setEvidenceNote] = useState("");
  const [contact, setContact] = useState("");
  const [status, setStatus] = useState<"idle" | "loading" | "ok" | "error">(
    "idle",
  );
  const [message, setMessage] = useState("");

  useEffect(() => {
    if (!open) return;
    setRestType(defaultRestType);
    setRestDays(defaultDaysForRestType(defaultRestType));
    setNote("");
    setEvidenceNote("");
    setContact("");
    setStatus("idle");
    setMessage("");
  }, [open, defaultRestType]);

  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    document.addEventListener("keydown", onKey);
    document.body.style.overflow = "hidden";
    return () => {
      document.removeEventListener("keydown", onKey);
      document.body.style.overflow = "";
    };
  }, [open, onClose]);

  if (!open) return null;

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    const restErr = validateRestDays(restType, restDays);
    if (restErr) {
      setStatus("error");
      setMessage(restErr);
      return;
    }
    setStatus("loading");
    setMessage("");
    try {
      const res = await fetch(`/api/companies/${companyId}/correct`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ restType, restDays, note, evidenceNote, contact }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(data.error || "提交失败");
      setStatus("ok");
      setMessage("已收到，进入待核实。");
    } catch (err) {
      setStatus("error");
      setMessage(err instanceof Error ? err.message : "提交失败");
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center sm:items-center">
      <div className="absolute inset-0 bg-ink/45" onClick={onClose} aria-hidden />
      <div
        role="dialog"
        aria-modal="true"
        aria-label="纠错或补充"
        className="relative max-h-[90vh] w-full overflow-y-auto rounded-t-2xl bg-white p-5 shadow-lift sm:max-w-lg sm:rounded-xl sm:p-6"
      >
        <div className="flex items-start justify-between gap-3">
          <div>
            <h2 className="text-lg font-bold text-ink">纠错 / 补充</h2>
            <p className="mt-1 text-sm text-haze">{companyName}</p>
          </div>
          <button
            type="button"
            className="min-h-10 min-w-10 rounded-md text-sm font-semibold text-haze hover:bg-paper"
            onClick={onClose}
            aria-label="关闭"
          >
            关闭
          </button>
        </div>

        {status === "ok" ? (
          <div className="mt-5 rounded-lg bg-rest-soft p-4">
            <p className="font-semibold text-rest-deep">{message}</p>
            <button type="button" className="btn-primary mt-4" onClick={onClose}>
              知道了
            </button>
          </div>
        ) : (
          <form className="mt-5 space-y-4" onSubmit={onSubmit}>
            <div>
              <label className="label" htmlFor="correct-rest">
                休息制度
              </label>
              <select
                id="correct-rest"
                className="field"
                value={restType}
                onChange={(e) => {
                  const next = e.target.value as RestType;
                  setRestType(next);
                  setRestDays(defaultDaysForRestType(next));
                }}
              >
                {REST_TYPES.map((r) => (
                  <option key={r}>{r}</option>
                ))}
              </select>
            </div>

            <div>
              <span className="label">每周休息日</span>
              <RestDayPicker
                restType={restType}
                value={restDays}
                onChange={setRestDays}
              />
            </div>

            <div>
              <label className="label" htmlFor="correct-note">
                补充说明
              </label>
              <textarea
                id="correct-note"
                className="field min-h-24"
                value={note}
                onChange={(e) => setNote(e.target.value)}
                placeholder="例如：总部一周休两天，门店轮休"
              />
            </div>
            <div>
              <label className="label" htmlFor="correct-evidence">
                依据说明
              </label>
              <textarea
                id="correct-evidence"
                className="field min-h-20"
                value={evidenceNote}
                onChange={(e) => setEvidenceNote(e.target.value)}
                placeholder="招聘页 / offer / 制度文件等（不上传原文件）"
              />
            </div>
            <div>
              <label className="label" htmlFor="correct-contact">
                联系方式（可选）
              </label>
              <input
                id="correct-contact"
                className="field"
                value={contact}
                onChange={(e) => setContact(e.target.value)}
              />
            </div>

            {status === "error" && message && (
              <p className="text-sm font-medium text-caution">{message}</p>
            )}

            <div className="flex gap-2 pt-1">
              <button
                type="submit"
                className="btn-primary flex-1"
                disabled={status === "loading"}
              >
                {status === "loading" ? "提交中…" : "提交"}
              </button>
              <button type="button" className="btn-ghost" onClick={onClose}>
                取消
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
}
