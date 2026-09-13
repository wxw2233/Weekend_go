"use client";

import { useState } from "react";
import { REST_TYPES, type RestType } from "@/lib/types";
import RestDayPicker from "@/components/RestDayPicker";
import {
  defaultDaysForRestType,
  validateRestDays,
} from "@/lib/rest-days";

const initial = {
  companyName: "",
  restType: "双休" as RestType,
  city: "",
  industry: "",
  policySummary: "",
  evidenceNote: "",
  contactName: "",
  contact: "",
};

export default function ClaimForm() {
  const [form, setForm] = useState(initial);
  const [restDays, setRestDays] = useState<number[]>(
    defaultDaysForRestType("双休"),
  );
  const [status, setStatus] = useState<"idle" | "loading" | "ok" | "error">(
    "idle",
  );
  const [message, setMessage] = useState("");

  function update<K extends keyof typeof initial>(key: K, value: string) {
    setForm((f) => ({ ...f, [key]: value }));
  }

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!form.companyName.trim() || !form.contact.trim()) {
      setStatus("error");
      setMessage("请填写企业名称与联系方式。");
      return;
    }
    const restErr = validateRestDays(form.restType, restDays);
    if (restErr) {
      setStatus("error");
      setMessage(restErr);
      return;
    }
    setStatus("loading");
    setMessage("");
    try {
      const res = await fetch("/api/claim", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ...form, restDays }),
      });
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data.error || "claim failed");
      }
      setStatus("ok");
      setMessage("认领已提交。我们会核验联系方式与材料，通过后标记为「企业认证」。");
      setForm(initial);
      setRestDays(defaultDaysForRestType("双休"));
    } catch (err) {
      setStatus("error");
      setMessage(err instanceof Error && err.message ? err.message : "提交失败，请稍后重试。");
    }
  }

  if (status === "ok") {
    return (
      <div className="border border-rest/30 bg-rest-soft p-6">
        <h2 className="font-display text-xl font-semibold text-rest">
          认领已提交
        </h2>
        <p className="mt-2 text-sm text-ink/80">{message}</p>
        <button
          type="button"
          className="btn-ghost mt-4"
          onClick={() => setStatus("idle")}
        >
          再认领一家
        </button>
      </div>
    );
  }

  return (
    <form
      onSubmit={onSubmit}
      className="panel space-y-5 p-5 sm:p-6"
    >
      <div>
        <label className="label" htmlFor="companyName">
          企业全称 *
        </label>
        <input
          id="companyName"
          className="field"
          required
          value={form.companyName}
          onChange={(e) => update("companyName", e.target.value)}
          placeholder="与营业执照一致"
        />
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <div>
          <label className="label" htmlFor="restType">
            总部休息制度 *
          </label>
          <select
            id="restType"
            className="field"
            value={form.restType}
            onChange={(e) => {
              const next = e.target.value as RestType;
              update("restType", next);
              setRestDays(defaultDaysForRestType(next));
            }}
          >
            {REST_TYPES.map((r) => (
              <option key={r}>{r}</option>
            ))}
          </select>
        </div>
        <div>
          <label className="label" htmlFor="city">
            总部城市
          </label>
          <input
            id="city"
            className="field"
            value={form.city}
            onChange={(e) => update("city", e.target.value)}
          />
        </div>
      </div>

      <div>
        <span className="label">每周休息日 *</span>
        <RestDayPicker
          restType={form.restType}
          value={restDays}
          onChange={setRestDays}
        />
      </div>

      <div>
        <label className="label" htmlFor="industry">
          行业
        </label>
        <input
          id="industry"
          className="field"
          value={form.industry}
          onChange={(e) => update("industry", e.target.value)}
        />
      </div>

      <div>
        <label className="label" htmlFor="policySummary">
          制度说明 *
        </label>
        <textarea
          id="policySummary"
          className="field min-h-28"
          required
          value={form.policySummary}
          onChange={(e) => update("policySummary", e.target.value)}
          placeholder="例如：一周固定休息两天（含轮休），法定节假日按国家规定。"
        />
      </div>

      <div>
        <label className="label" htmlFor="evidenceNote">
          可核验材料说明 *
        </label>
        <textarea
          id="evidenceNote"
          className="field min-h-24"
          required
          value={form.evidenceNote}
          onChange={(e) => update("evidenceNote", e.target.value)}
          placeholder="例如：员工手册第 3 章、公开招聘页、盖章制度文件（可后续补发）"
        />
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <div>
          <label className="label" htmlFor="contactName">
            对接人
          </label>
          <input
            id="contactName"
            className="field"
            value={form.contactName}
            onChange={(e) => update("contactName", e.target.value)}
          />
        </div>
        <div>
          <label className="label" htmlFor="contact">
            工作邮箱 / 企业微信 *
          </label>
          <input
            id="contact"
            className="field"
            required
            value={form.contact}
            onChange={(e) => update("contact", e.target.value)}
            placeholder="需可回访核验"
          />
        </div>
      </div>

      {status === "error" && message && (
        <p className="text-sm font-medium text-caution">{message}</p>
      )}

      <div className="flex flex-wrap items-center gap-3 pt-2">
        <button type="submit" className="btn-primary" disabled={status === "loading"}>
          {status === "loading" ? "提交中…" : "提交认领"}
        </button>
        <p className="text-xs text-haze">
          认领通过后，条目将标记为「企业认证」。虚假认领会被驳回并保留记录。
        </p>
      </div>
    </form>
  );
}
