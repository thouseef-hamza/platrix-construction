"use client";

import React, { useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import { CompanyProvider } from "@/context/CompanyContext";
import { useAuth } from "@/context/AuthContext";
import { useAccount } from "@/context/AccountContext";
import AdminChrome from "@/layout/AdminChrome";
import { notFound } from "next/navigation";

export default function CompanyLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const params = useParams();
  const router = useRouter();
  const { isAuthenticated, authReady } = useAuth();
  const { accounts, switchAccount } = useAccount();
  const id = params?.id as string | undefined;

  useEffect(() => {
    if (!authReady) return;
    if (!isAuthenticated) {
      router.replace("/signin");
    }
  }, [authReady, isAuthenticated, router]);

  // Sync current account with URL so x-account-id header matches the account page
  useEffect(() => {
    if (!id || !accounts.length) return;
    const n = parseInt(id, 10);
    if (!Number.isNaN(n) && accounts.some((a) => a.id === n)) {
      switchAccount(n);
    }
  }, [id, accounts, switchAccount]);

  if (!id) {
    notFound();
  }

  if (!authReady || !isAuthenticated) {
    return null;
  }

  return (
    <CompanyProvider companyId={id}>
      <AdminChrome>{children}</AdminChrome>
    </CompanyProvider>
  );
}
