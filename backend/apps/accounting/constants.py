"""
Constants for the accounting app (chart of accounts, ledger entries, etc.).
"""

# Account types (chart of accounts categories)
ACCOUNT_TYPE_ASSET = 1
ACCOUNT_TYPE_LIABILITY = 2
ACCOUNT_TYPE_EQUITY = 3
ACCOUNT_TYPE_REVENUE = 4
ACCOUNT_TYPE_EXPENSE = 5

ACCOUNT_TYPE_CHOICES = [
    (ACCOUNT_TYPE_ASSET, "Asset"),
    (ACCOUNT_TYPE_LIABILITY, "Liability"),
    (ACCOUNT_TYPE_EQUITY, "Equity"),
    (ACCOUNT_TYPE_REVENUE, "Revenue"),
    (ACCOUNT_TYPE_EXPENSE, "Expense"),
]

# Normal balance for an account type
NORMAL_BALANCE_DEBIT = "debit"
NORMAL_BALANCE_CREDIT = "credit"

NORMAL_BALANCE_CHOICES = [
    (NORMAL_BALANCE_DEBIT, "Debit"),
    (NORMAL_BALANCE_CREDIT, "Credit"),
]

# Ledger entry source (where the entry originated) – integers for DB performance
ENTRY_SOURCE_MANUAL = 0
ENTRY_SOURCE_SALES = 1
ENTRY_SOURCE_PURCHASE = 2
ENTRY_SOURCE_INVOICE = 3
ENTRY_SOURCE_PAYMENT = 4
ENTRY_SOURCE_ADJUSTMENT = 5
ENTRY_SOURCE_OPENING_BALANCE = 6
ENTRY_SOURCE_OTHER = 7

ENTRY_SOURCE_CHOICES = [
    (ENTRY_SOURCE_MANUAL, "Manual"),
    (ENTRY_SOURCE_SALES, "Sales"),
    (ENTRY_SOURCE_PURCHASE, "Purchase"),
    (ENTRY_SOURCE_INVOICE, "Invoice"),
    (ENTRY_SOURCE_PAYMENT, "Payment"),
    (ENTRY_SOURCE_ADJUSTMENT, "Adjustment"),
    (ENTRY_SOURCE_OPENING_BALANCE, "Opening balance"),
    (ENTRY_SOURCE_OTHER, "Other"),
]

# Ledger entry status – integers for DB performance
ENTRY_STATUS_DRAFT = 0
ENTRY_STATUS_POSTED = 1
ENTRY_STATUS_VOID = 2

ENTRY_STATUS_CHOICES = [
    (ENTRY_STATUS_DRAFT, "Draft"),
    (ENTRY_STATUS_POSTED, "Posted"),
    (ENTRY_STATUS_VOID, "Void"),
]
