import type { Metadata } from "next";
import Link from "next/link";

export const metadata: Metadata = {
  title: "用户协议 · 双休go!",
  description: "双休go! 用户协议：服务性质、内容规范与免责说明。",
};

const CONTACT = "wxw2749@outlook.com";

function H({ children }: { children: React.ReactNode }) {
  return <h2 className="mt-8 text-lg font-bold text-ink">{children}</h2>;
}

function P({ children }: { children: React.ReactNode }) {
  return <p className="mt-2 text-sm leading-6 text-haze">{children}</p>;
}

export default function TermsPage() {
  return (
    <div className="container-page max-w-3xl py-10">
      <h1 className="text-2xl font-bold text-ink">用户协议</h1>
      <p className="mt-1 text-sm text-haze">更新日期：2026-10-11</p>

      <P>
        注册或使用双休go!（以下简称"本站"）即表示你已阅读并同意本协议。
      </P>

      <H>一、服务性质</H>
      <P>
        本站是一个企业休息制度信息目录：内容来源于公开资料整理与用户提交，
        旨在帮助职场人了解企业休息制度状况。本站不对任何企业作事实认定或法律评价，
        所有信息（包括用户提交与投票结果）均为参考性质。
      </P>

      <H>二、内容规范</H>
      <P>使用本站时，你承诺不发布以下内容：</P>
      <P>
        1. 虚假、捏造或无法说明依据的企业信息；2. 侮辱、诽谤他人或企业，侵犯他人合法权益的内容；
        3. 广告引流、刷量、诈骗等垃圾信息；4. 法律法规禁止的其他内容。
      </P>
      <P>
        违反上述规范的内容将被删除；情节严重的（如恶意捏造、重复 spam），本站有权限制或注销账号。
      </P>

      <H>三、内容授权</H>
      <P>
        你在本站发布的内容，视为授权本站公开展示。你应对自己发布的内容负责；
        因你发布的内容引起纠纷的，由你承担相应责任，本站将配合依法提供必要协助。
      </P>

      <H>四、企业申诉</H>
      <P>
        如你是企业相关方，认为本站内容与事实不符，可发送邮件至{" "}
        <span className="font-semibold text-ink">{CONTACT}</span>{" "}
        申诉。核实后我们将更正或处理相关内容。企业的休息制度信息也可以通过
        企业认领 流程提交官方说明。
      </P>

      <H>五、免责声明</H>
      <P>
        1. 本站信息可能滞后、不准确或不完整，请以劳动合同与实际制度为准；
        2. 用户评论与真假投票仅代表发布者个人经验与主观感受，不构成对企业的事实认定；
        3. 本站不因你依据本站信息作出的任何消费或职业决策承担责任；
        4. 因不可抗力或系统维护导致服务中断，本站不承担责任。
      </P>

      <H>六、账号</H>
      <P>
        你应妥善保管账号密码。账号下的行为视为你本人行为。你可以随时在
        账号 页面注销账号。
      </P>

      <H>七、协议变更</H>
      <P>
        协议如有重大变更，会在本页更新日期。继续使用即视为接受变更。
      </P>

      <p className="mt-10 text-sm text-haze">
        联系 {CONTACT} · 查看{" "}
        <Link href="/privacy" className="text-rest hover:underline">
          隐私政策
        </Link>{" "}
        · 返回{" "}
        <Link href="/" className="text-rest hover:underline">
          首页
        </Link>
      </p>
    </div>
  );
}
