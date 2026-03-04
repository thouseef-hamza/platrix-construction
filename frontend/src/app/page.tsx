"use client";

import { useAuth } from "@/context/AuthContext";
import { useRouter } from "next/navigation";
import { useEffect } from "react";

export default function RootPage() {
  const router = useRouter();
  const { isAuthenticated, authReady, accounts } = useAuth();

  useEffect(() => {
    if (!authReady) return;
    if (!isAuthenticated || accounts.length === 0) {
      router.replace("/signin");
      return;
    }
    router.replace(`/company/${accounts[0].id}`);
  }, [authReady, isAuthenticated, accounts, router]);

  return null;
}
