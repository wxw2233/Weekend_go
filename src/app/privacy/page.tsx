import type { Metadata } from "next";
import Link from "next/link";

export const metadata: Metadata = {
  title: "隐私政策 · 双休go!",
  description: "双休go! 隐私政策：我们收集哪些信息、如何使用与保护。",
};

const CONTACT = "wxw2749@outlook.com";

function H({ children }: { children: React.ReactNode }) {
  return <h2 className="mt-8 text-lg font-bold text-ink">{children}</h2>;
}

function P({ children }: { children: React.ReactNode }) {
  return <p className="mt-2 text-sm leading-6 text-haze">{children}</p>;
}

export default function PrivacyPage() {
  return (
    <div className="container-page max-w-3xl py-10">
      <h1 className="text-2xl font-bold text-ink">隐私政策</h1>
      <p className="mt-1 text-sm text-haze">更新日期：2026-10-11</p>

      <P>
        双休go!（以下简称"本站"）是一个由用户共同维护的企业休息制度信息目录。我们尽可能用最少的
        数据提供服务，本文说明我们收集哪些信息、如何使用与保护它们。
      </P>

      <H>一、我们收集的信息</H>
      <P>
        <strong>账号信息</strong>：注册时收集用户名与邮箱。邮箱仅用于注册验证、找回密码与
        内容申诉联系，不会展示给其他用户。
      </P>
      <P>
        <strong>你发布的内容</strong>：评论、企业信息提交、纠错补充、真假投票等，发布后
        默认公开展示，其中评论会附带你的用户名。
      </P>
      <P>
        <strong>网络信息</strong>：为防止刷量与滥用，我们会处理你的 IP
        地址用于频率限制与行为校验。IP 仅在服务端用于限流判断，不会与你的公开内容一起展示。
      </P>
      <P>
        <strong>Cookies</strong>：登录状态通过 Cookie（sx_user_session）维持，为
        httpOnly、生产环境 Secure。禁用 Cookie 将无法登录。
      </P>

      <H>二、信息的使用</H>
      <P>
        信息仅用于：维持账号与登录、展示你发布的内容、防止滥用与垃圾信息、
        与你沟通申诉或核实事宜。我们不进行用户画像、不投放广告、
        不向任何第三方出售或共享你的个人信息。
      </P>

      <H>三、信息的存储与保护</H>
      <P>
        数据存储于本站服务器，密码经单向加盐散列存储，任何人（包括管理员）无法看到你的原始密码。
        我们采取了访问控制、频率限制、内容过滤等措施防止数据被滥用。
      </P>

      <H>四、你的权利</H>
      <P>
        <strong>改密码</strong>：登录后在 账号 页面修改。
      </P>
      <P>
        <strong>注销账号</strong>：登录后在 账号 页面操作。注销后你的评论将以
        "已注销" 匿名保留（以维持评论区上下文），账号信息随之删除。
      </P>
      <P>
        <strong>删除/更正内容</strong>：你可以删除自己的评论；其他提交类内容如需撤回，
        可通过下方联系方式提出。
      </P>

      <H>五、未成年人</H>
      <P>本站面向职场人群，不面向未成年人提供服务。</P>

      <H>六、内容投诉与企业申诉</H>
      <P>
        如你认为本站任何内容（含企业信息、评论、投票结果）侵犯了你的合法权益或与事实不符，
        请发送邮件至 <span className="font-semibold text-ink">{CONTACT}</span>，
        说明具体页面与理由。我们核实后会处理相关内容；涉及企业信息的主张，建议附上可核验的依据。
      </P>

      <H>七、政策更新</H>
      <P>
        政策如有重大变更，会在本页更新日期。继续使用本站即视为接受更新后的政策。
      </P>

      <p className="mt-10 text-sm text-haze">
        如有疑问请联系 {CONTACT} · 返回{" "}
        <Link href="/" className="text-rest hover:underline">
          首页
        </Link>
      </p>
    </div>
  );
}
