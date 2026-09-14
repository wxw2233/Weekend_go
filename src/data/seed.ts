import type { Company } from "@/lib/types";

/** companies 表为空时灌入的种子数据（见 db.ts getDb） */
export const seedCompanies: Company[] = [
  {
    id: "c-night",
    name: "夜航便利",
    industry: "零售连锁",
    city: "重庆",
    restType: "不休",
    source: "seed_jd",
    note: "24 小时门店，岗位无固定周休。",
    evidenceHint: "门店招聘页",
    updatedAt: "2026-09-12",
  },
];
