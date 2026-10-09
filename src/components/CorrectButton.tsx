"use client";

import { useState } from "react";
import type { RestType } from "@/lib/types";
import CorrectModal from "@/components/CorrectModal";

export default function CorrectButton({
  companyId,
  companyName,
  defaultRestType,
  isLoggedIn,
}: {
  companyId: string;
  companyName: string;
  defaultRestType: RestType;
  isLoggedIn: boolean;
}) {
  const [open, setOpen] = useState(false);

  if (!isLoggedIn) {
    return (
      <button
        type="button"
        className="btn-primary"
        onClick={() => {
          window.location.href = `/login?next=${encodeURIComponent(
            window.location.pathname,
          )}`;
        }}
      >
        纠错 / 补充
      </button>
    );
  }

  return (
    <>
      <button type="button" className="btn-primary" onClick={() => setOpen(true)}>
        纠错 / 补充
      </button>
      <CorrectModal
        companyId={companyId}
        companyName={companyName}
        defaultRestType={defaultRestType}
        open={open}
        onClose={() => setOpen(false)}
      />
    </>
  );
}
