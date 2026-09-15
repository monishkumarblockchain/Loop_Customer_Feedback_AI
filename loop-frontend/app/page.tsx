"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { isAdmin } from "@/lib/auth";

export default function UsersPage() {
  const router = useRouter();

  useEffect(() => {
    if (!isAdmin()) {
      router.replace("/dashboard");
    }
  }, [router]);

  if (!isAdmin()) {
    return null;
  }

  return (
    <div>
      {/* Users management */}
    </div>
  );
}