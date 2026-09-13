import ClaimForm from "@/components/ClaimForm";

export default function ClaimPage() {
  return (
    <div className="container-page max-w-2xl py-8">
      <h1 className="text-xl font-bold text-ink">企业认领</h1>
      <div className="mt-4">
        <ClaimForm />
      </div>
    </div>
  );
}
