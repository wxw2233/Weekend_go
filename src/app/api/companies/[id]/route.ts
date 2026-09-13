import { NextResponse } from "next/server";
import { deleteCompany, getCompany } from "@/lib/store";
import { isRequestAdmin, adminUnauthorized } from "@/lib/admin-auth";
import { logWarn } from "@/lib/log";
import { getRequestUser } from "@/lib/user-auth-http";

export async function DELETE(
  request: Request,
  ctx: { params: Promise<{ id: string }> },
) {
  if (!(await isRequestAdmin(request))) {
    return adminUnauthorized();
  }

  const { id } = await ctx.params;
  const company = await getCompany(id);
  if (!company) {
    return NextResponse.json({ error: "企业不存在" }, { status: 404 });
  }

  const ok = await deleteCompany(id);
  if (!ok) {
    return NextResponse.json({ error: "删除失败" }, { status: 500 });
  }

  const user = await getRequestUser(request);
  logWarn("company_deleted", {
    companyId: id,
    name: company.name,
    by: user?.username || "admin-session",
  });

  return NextResponse.json({ ok: true });
}
