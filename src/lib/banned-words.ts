/**
 * 敏感词/垃圾内容词表：命中即拒绝提交。
 * 维护方式：往 RAW_WORDS 里一行一个地加词即可，支持随时热补充（重新构建后生效）。
 * 注意：过短的词（2 个字母/字）可能误伤正常内容，加词前先想一下常见语境。
 */

const RAW_WORDS: string[] = [
  // —— 广告引流 / 刷量 / 诈骗 ——
  "加微信", "加vx", "加v信", "加qq", "加扣扣", "微信号", "vx号", "v信", "威信", "wx号",
  "代刷", "刷单", "刷赞", "涨粉", "兼职群", "网赚", "博彩", "赌博", "六合彩",
  "引流推广", "回收账号", "接广告", "带单", "返利", "高额回报", "日结工资",
  // —— 色情 / 低俗 ——
  "约炮", "援交", "一夜情", "上门服务", "特殊服务", "裸聊", "黄色网站",
  // —— 辱骂 / 人身攻击 ——
  "傻逼", "煞笔", "傻b", "妈的", "他妈的", "草泥马", "nmsl", "贱人", "婊子",
  "全家死", "去死吧", "脑残", "弱智",
];

/** 全角→半角、去零宽字符与装饰分隔符、小写 */
function normalize(s: string): string {
  return s
    .toLowerCase()
    .replace(/[\uFF01-\uFF5E]/g, (ch) =>
      String.fromCharCode(ch.charCodeAt(0) - 0xfee0),
    )
    .replace(/[\u200b-\u200d\uFEFF\s·•*~\-_—–|]/g, "");
}

const BANNED = new Set(RAW_WORDS.map(normalize).filter((w) => w.length >= 2));

/** 命中返回 true。原文与去装饰归一化文本（对抗 微·信 / v❤x 之类变体）都参与匹配。 */
export function containsBannedWords(text: string): boolean {
  if (!text) return false;
  const flat = normalize(text);
  for (const w of BANNED) {
    if (flat.includes(w)) return true;
  }
  return false;
}

/** 多字段任一命中即 true */
export function anyContainsBannedWords(...texts: string[]): boolean {
  return texts.some((t) => typeof t === "string" && containsBannedWords(t));
}
