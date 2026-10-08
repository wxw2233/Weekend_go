import SubmitForm from "@/components/SubmitForm";

export default function SubmitPage() {
  return (
    <div className="container-page max-w-2xl py-8">
      <h1 className="text-xl font-bold text-ink">提交标注</h1>
      <p className="mt-1 text-sm text-haze">补充休息制度线索，默认进入待核实</p>
      <div className="mt-4">
        <SubmitForm />
      </div>
    </div>
  );
}
