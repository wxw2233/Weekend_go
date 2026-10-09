import ClaimForm from "@/components/ClaimForm";
import LoginGate from "@/components/LoginGate";
import { getCurrentUser } from "@/lib/user-auth-http";

export const dynamic = "force-dynamic";

export default async function ClaimPage() {
  const user = await getCurrentUser();

  return (
    <div className="container-page max-w-2xl py-8">
      <h1 className="text-xl font-bold text-ink">企业认领</h1>
      <div className="mt-4">
        {user ? (
          <ClaimForm />
        ) : (
          <LoginGate
            next="/sx/claim"
            title="企业认领需要登录"
            description="登录后才能认领企业并维护其休息制度信息，方便我们核实你是该企业的成员或代表。"
          />
        )}
      </div>
    </div>
  );
}
