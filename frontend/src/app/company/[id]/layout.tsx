"use client";

import React, { useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import { CompanyProvider } from "@/context/CompanyContext";
import { useAuth } from "@/context/AuthContext";
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
  const id = params?.id as string | undefined;

  useEffect(() => {
    if (!authReady) return;
    if (!isAuthenticated) {
      router.replace("/signin");
    }
  }, [authReady, isAuthenticated, router]);

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
