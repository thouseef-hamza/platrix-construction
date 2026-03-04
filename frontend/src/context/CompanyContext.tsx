"use client";

import React, { createContext, useContext, useMemo } from "react";

type CompanyContextType = {
  companyId: string | null;
  /** Base path for the current company, e.g. /company/123. Null when not in a company route (e.g. auth). */
  basePath: string | null;
  /** Build a company-scoped path. segment should be "" for dashboard, or "/projects", "/employee", etc. */
  path: (segment: string) => string;
};

const CompanyContext = createContext<CompanyContextType | undefined>(undefined);

export function CompanyProvider({
  companyId,
  children,
}: {
  companyId: string;
  children: React.ReactNode;
}) {
  const value = useMemo<CompanyContextType>(() => {
    const base = `/company/${companyId}`;
    return {
      companyId,
      basePath: base,
      path: (segment: string) => (segment === "" || segment === "/" ? base : `${base}${segment.startsWith("/") ? segment : `/${segment}`}`),
    };
  }, [companyId]);

  return (
    <CompanyContext.Provider value={value}>{children}</CompanyContext.Provider>
  );
}

export function useCompany(): CompanyContextType {
  const context = useContext(CompanyContext);
  if (context === undefined) {
    return {
      companyId: null,
      basePath: null,
      path: (segment: string) => (segment === "" || segment === "/" ? "/" : segment),
    };
  }
  return context;
}

/** Use only inside company routes. Returns basePath and path(); throws if not in company context. */
export function useCompanyStrict(): CompanyContextType {
  const context = useContext(CompanyContext);
  if (context === undefined || context.companyId === null) {
    throw new Error("useCompanyStrict must be used within a CompanyProvider with a company route");
  }
  return context;
}
