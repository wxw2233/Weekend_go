import SubmitForm from "@/components/SubmitForm";
import LoginGate from "@/components/LoginGate";
import { getCurrentUser } from "@/lib/user-auth-http";

export const dynamic = "force-dynamic";

export default async function SubmitPage() {
  const user = await getCurrentUser();

  return (
    <div className="container-page max-w-2xl py-8">
      <h1 className="text-xl font-bold text-ink">提交标注</h1>
      <p className="mt-1 text-sm text-haze">补充休息制度线索，默认进入待核实</p>
      <div className="mt-4">
        {user ? (
          <SubmitForm />
        ) : (
          <LoginGate
            next="/sx/submit"
            title="提交标注需要登录"
            description="登录后才能提交企业休息制度线索。这能有效减少重复与垃圾提交，你提交的内容也会记录在账号下方便追踪核实进度。"
          />
        )}
      </div>
    </div>
  );
}
