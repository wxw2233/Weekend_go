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
  position: "",
  note: "",
  evidenceNote: "",
  contact: "",
};

export default function SubmitForm() {
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
    if (!form.companyName.trim()) {
      setStatus("error");
      setMessage("请填写企业名称。");
      return;
    }
    if (!form.evidenceNote.trim()) {
      setStatus("error");
      setMessage("请填写证据说明。");
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
      const res = await fetch("/api/submit", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ...form, restDays }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(data.error || "提交失败");
      setStatus("ok");
      setMessage("已收到，进入待核实队列。审核通过后会出现在企业库。");
      setForm(initial);
      setRestDays(defaultDaysForRestType("双休"));
    } catch (err) {
      setStatus("error");
      setMessage(err instanceof Error ? err.message : "提交失败，请稍后重试。");
    }
  }

  if (status === "ok") {
    return (
      <div className="rounded-lg border border-rest/30 bg-rest-soft p-6">
        <h2 className="font-display text-xl font-semibold text-rest">提交成功</h2>
        <p className="mt-2 text-sm text-ink/80">{message}</p>
        <button type="button" className="btn-ghost mt-4" onClick={() => setStatus("idle")}>
          再提交一家
        </button>
      </div>
    );
  }

  return (
    <form onSubmit={onSubmit} className="panel space-y-5 p-5 sm:p-6" noValidate>
      <div>
        <label className="label" htmlFor="companyName">
          企业名称 *
        </label>
        <input
          id="companyName"
          className="field"
          required
          value={form.companyName}
          onChange={(e) => update("companyName", e.target.value)}
          placeholder="请填写营业执照全称或常用名"
        />
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <div>
          <label className="label" htmlFor="restType">
            休息制度 *
          </label>
          <select
            id="restType"
            className="field"
            required
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
            城市
          </label>
          <input
            id="city"
            className="field"
            value={form.city}
            onChange={(e) => update("city", e.target.value)}
            placeholder="如：杭州"
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

      <div className="grid gap-4 sm:grid-cols-2">
        <div>
          <label className="label" htmlFor="industry">
            行业
          </label>
          <input
            id="industry"
            className="field"
            value={form.industry}
            onChange={(e) => update("industry", e.target.value)}
            placeholder="如：消费品牌"
          />
        </div>
        <div>
          <label className="label" htmlFor="position">
            岗位
          </label>
          <input
            id="position"
            className="field"
            value={form.position}
            onChange={(e) => update("position", e.target.value)}
            placeholder="如：运营 / 产线 / 门店"
          />
        </div>
      </div>

      <div>
        <label className="label" htmlFor="note">
          补充说明
        </label>
        <textarea
          id="note"
          className="field min-h-24"
          value={form.note}
          onChange={(e) => update("note", e.target.value)}
          placeholder="例如：总部一周休两天，门店轮休。"
        />
      </div>

      <div>
        <label className="label" htmlFor="evidenceNote">
          证据说明 *
        </label>
        <textarea
          id="evidenceNote"
          className="field min-h-20"
          required
          value={form.evidenceNote}
          onChange={(e) => update("evidenceNote", e.target.value)}
          placeholder="例如：招聘页写明一周休两天；请勿写他人隐私。"
        />
      </div>

      <div>
        <label className="label" htmlFor="contact">
          联系方式（可选，便于核实）
        </label>
        <input
          id="contact"
          className="field"
          value={form.contact}
          onChange={(e) => update("contact", e.target.value)}
          placeholder="邮箱或微信，仅用于审核沟通"
        />
      </div>

      {status === "error" && message && (
        <p className="text-sm font-medium text-caution">{message}</p>
      )}

      <div className="flex flex-wrap items-center gap-3 pt-2">
        <button type="submit" className="btn-primary" disabled={status === "loading"}>
          {status === "loading" ? "提交中…" : "提交标注"}
        </button>
        <p className="text-xs text-haze">
          * 为必填。仅作信息参考，不构成法律评价。
        </p>
      </div>
    </form>
  );
}
