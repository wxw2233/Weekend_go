export type RestType = "双休" | "大小周" | "单休" | "排班制" | "不休";

export type RestLevel = "green" | "yellow" | "red" | "gray";

export type SourceType = "certified" | "seed_jd" | "user" | "pending";

export interface Company {
  id: string;
  name: string;
  industry: string;
  city: string;
  restType: RestType;
  source: SourceType;
  note: string;
  evidenceHint: string;
  updatedAt: string;
  /** 0=周一 … 6=周日；有值则按真实休息日展示 */
  restDays?: number[];
  position?: string;
}

export type ReviewStatus = "pending" | "approved" | "rejected";

export interface Submission {
  id: string;
  companyName: string;
  restType: RestType;
  city: string;
  industry: string;
  note: string;
  evidenceNote: string;
  contact: string;
  status: ReviewStatus;
  createdAt: string;
  reviewedAt?: string;
  reviewNote?: string;
  companyRef?: string | null;
  restDays?: number[];
  position?: string;
}

export interface Claim {
  id: string;
  companyName: string;
  restType: RestType;
  city: string;
  industry: string;
  policySummary: string;
  evidenceNote: string;
  contactName: string;
  contact: string;
  status: ReviewStatus;
  createdAt: string;
  reviewedAt?: string;
  reviewNote?: string;
  restDays?: number[];
}

export interface Comment {
  id: string;
  companyId: string;
  userId: string;
  username: string;
  content: string;
  createdAt: string;
  parentId: string | null;
  replyToUsername: string | null;
}

export type CommentWithMeta = Comment & {
  likeCount: number;
  likedByMe: boolean;
};

/** 双休 = 一周任意休息 ≥ 2 天，不限周六周日 */
export const REST_TYPES: RestType[] = [
  "双休",
  "大小周",
  "单休",
  "排班制",
  "不休",
];

export const SOURCE_LABEL: Record<SourceType, string> = {
  certified: "企业认证",
  seed_jd: "招聘JD",
  user: "用户提交",
  pending: "待核实",
};

/** 每周休息天数（近似） */
export function restDaysPerWeek(restType: RestType): number {
  switch (restType) {
    case "双休":
      return 2;
    case "大小周":
      return 1.5;
    case "单休":
      return 1;
    case "排班制":
      return 1;
    case "不休":
      return 0;
    default:
      return 0;
  }
}

/** 绿=双休（或明确休≥2天），黄=单休/大小周/排班，红=不休 */
export function restLevel(
  restType: RestType,
  restDays?: number[] | null,
): RestLevel {
  if (restType === "双休") return "green";
  if (restDays && restDays.length >= 2) return "green";
  switch (restType) {
    case "大小周":
    case "单休":
    case "排班制":
      return "yellow";
    case "不休":
      return "red";
    default:
      return "gray";
  }
}

export function isDualRest(restType: RestType, restDays?: number[] | null): boolean {
  if (restType === "双休") return true;
  if (restDays && restDays.length >= 2) return true;
  return restDaysPerWeek(restType) >= 2;
}
