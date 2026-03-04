import type { Account, AccountType } from "@/types/chartOfAccounts";
import type {
  JournalEntry,
  JournalEntryLine,
  JournalEntryStatus,
} from "@/types/chartOfAccounts";
import { api } from "./api";

const ACCOUNT_TYPE_MAP: Record<number, AccountType> = {
  1: "asset",
  2: "liability",
  3: "equity",
  4: "revenue",
  5: "expense",
};

const ACCOUNT_TYPE_TO_BACKEND: Record<AccountType, number> = {
  asset: 1,
  liability: 2,
  equity: 3,
  revenue: 4,
  expense: 5,
};

const STATUS_MAP: Record<number, JournalEntryStatus> = {
  0: "draft",
  1: "posted",
  2: "posted",
};

const STATUS_TO_BACKEND: Record<JournalEntryStatus, number> = {
  draft: 0,
  posted: 1,
};

// --- Backend response types ---
export interface ApiChartOfAccount {
  id: string;
  account: string;
  code: string;
  name: string;
  account_type: number;
  account_type_display?: string;
  parent: string | null;
  description: string;
  is_active: boolean;
  is_system: boolean;
  created_at: string;
  updated_at: string;
}

export interface ApiLedgerLine {
  id: string;
  entry: string;
  chart_of_account: string;
  chart_of_account_code: string;
  chart_of_account_name: string;
  line_number: number;
  description: string;
  debit: string;
  credit: string;
  created_at: string;
}

export interface ApiLedgerEntry {
  id: string;
  account: string;
  entry_number: string;
  entry_date: string;
  posting_date: string;
  description: string;
  reference: string;
  source: number;
  source_display?: string;
  status: number;
  status_display?: string;
  posted_at: string | null;
  posted_by: string | null;
  created_by: string | null;
  lines: ApiLedgerLine[];
  created_at: string;
  updated_at: string;
}

function apiCoaToAccount(apiCoa: ApiChartOfAccount): Account {
  return {
    id: apiCoa.id,
    code: apiCoa.code,
    name: apiCoa.name,
    type: ACCOUNT_TYPE_MAP[apiCoa.account_type] ?? "expense",
    parentId: apiCoa.parent ?? null,
    openingBalance: 0,
    isActive: apiCoa.is_active,
  };
}

function apiLineToJournalLine(apiLine: ApiLedgerLine): JournalEntryLine {
  return {
    id: apiLine.id,
    accountId: apiLine.chart_of_account,
    accountCode: apiLine.chart_of_account_code,
    accountName: apiLine.chart_of_account_name,
    debit: parseFloat(apiLine.debit) || 0,
    credit: parseFloat(apiLine.credit) || 0,
    description: apiLine.description || undefined,
  };
}

function apiEntryToJournalEntry(apiEntry: ApiLedgerEntry): JournalEntry {
  return {
    id: apiEntry.id,
    number: apiEntry.entry_number,
    date: apiEntry.entry_date,
    description: apiEntry.description || "—",
    status: STATUS_MAP[apiEntry.status] ?? "draft",
    lines: (apiEntry.lines ?? []).map(apiLineToJournalLine),
  };
}

// --- Chart of accounts ---
export async function fetchChartOfAccounts(
  accountId: string
): Promise<Account[]> {
  const { data } = await api.get<ApiChartOfAccount[]>(
    "/accounting/chart-of-accounts/",
    { params: { account_id: accountId } }
  );
  return (data ?? []).map(apiCoaToAccount);
}

export async function createChartOfAccount(
  accountId: string,
  payload: {
    code: string;
    name: string;
    type: AccountType;
    parentId: string | null;
    isActive: boolean;
  }
): Promise<Account> {
  const { data } = await api.post<ApiChartOfAccount>(
    "/accounting/chart-of-accounts/",
    {
      account: accountId,
      code: payload.code,
      name: payload.name,
      account_type: ACCOUNT_TYPE_TO_BACKEND[payload.type],
      parent: payload.parentId || null,
      is_active: payload.isActive,
    }
  );
  return apiCoaToAccount(data);
}

export async function getChartOfAccount(
  accountId: string,
  id: string
): Promise<Account | null> {
  const { data } = await api.get<ApiChartOfAccount>(
    `/accounting/chart-of-accounts/${id}/`,
    { params: { account_id: accountId } }
  );
  return data ? apiCoaToAccount(data) : null;
}

// --- Journal entries ---
export async function fetchJournalEntries(
  accountId: string
): Promise<JournalEntry[]> {
  const { data } = await api.get<ApiLedgerEntry[]>(
    "/accounting/journal-entries/",
    { params: { account_id: accountId } }
  );
  return (data ?? []).map(apiEntryToJournalEntry);
}

export async function getJournalEntry(
  accountId: string,
  id: string
): Promise<JournalEntry | null> {
  const { data } = await api.get<ApiLedgerEntry>(
    `/accounting/journal-entries/${id}/`,
    { params: { account_id: accountId } }
  );
  return data ? apiEntryToJournalEntry(data) : null;
}

export async function fetchJournalEntryNextNumber(
  accountId: string
): Promise<string> {
  const { data } = await api.get<{ entry_number: string }>(
    "/accounting/journal-entries/next-number/",
    { params: { account_id: accountId } }
  );
  return data.entry_number;
}

export interface CreateJournalEntryPayload {
  number?: string;
  date: string;
  description: string;
  status: JournalEntryStatus;
  lines: Array<{
    accountId: string;
    debit: number;
    credit: number;
    description?: string;
  }>;
}

export async function createJournalEntry(
  accountId: string,
  payload: CreateJournalEntryPayload
): Promise<JournalEntry> {
  const dateStr = payload.date.slice(0, 10);
  const { data } = await api.post<ApiLedgerEntry>(
    "/accounting/journal-entries/",
    {
      account: accountId,
      entry_number: payload.number || undefined,
      entry_date: dateStr,
      posting_date: dateStr,
      description: payload.description || "—",
      reference: "",
      source: 0,
      status: STATUS_TO_BACKEND[payload.status],
      lines: payload.lines.map((line, i) => ({
        chart_of_account: line.accountId,
        line_number: i + 1,
        description: line.description ?? "",
        debit: String(line.debit),
        credit: String(line.credit),
      })),
    }
  );
  return apiEntryToJournalEntry(data);
}
