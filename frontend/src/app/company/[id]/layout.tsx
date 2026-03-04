"use client";

import React from "react";
import { useParams } from "next/navigation";
import { CompanyProvider } from "@/context/CompanyContext";
import AdminChrome from "@/layout/AdminChrome";
import { notFound } from "next/navigation";

export default function CompanyLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const params = useParams();
  const id = params?.id as string | undefined;

  if (!id) {
    notFound();
  }

  return (
    <CompanyProvider companyId={id}>
      <AdminChrome>{children}</AdminChrome>
    </CompanyProvider>
  );
}
