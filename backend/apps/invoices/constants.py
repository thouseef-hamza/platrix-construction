"""Constants for invoices app (unified client & subcontractor)."""

# Invoice type: client (receivable) or subcontractor (payable)
INVOICE_TYPE_CLIENT = 0
INVOICE_TYPE_SUBCONTRACTOR = 1

INVOICE_TYPE_CHOICES = [
    (INVOICE_TYPE_CLIENT, "Client"),
    (INVOICE_TYPE_SUBCONTRACTOR, "Subcontractor"),
]

# Ledger status
INVOICE_STATUS_DRAFT = 0
INVOICE_STATUS_POSTED = 1

INVOICE_STATUS_CHOICES = [
    (INVOICE_STATUS_DRAFT, "Draft"),
    (INVOICE_STATUS_POSTED, "Posted"),
]

# Payment method
PAYMENT_METHOD_CASH = 0
PAYMENT_METHOD_BANK = 1

PAYMENT_METHOD_CHOICES = [
    (PAYMENT_METHOD_CASH, "Cash"),
    (PAYMENT_METHOD_BANK, "Bank"),
]

# Payment ledger status for individual payments
PAYMENT_LEDGER_DRAFT = 0
PAYMENT_LEDGER_POSTED = 1

PAYMENT_LEDGER_STATUS_CHOICES = [
    (PAYMENT_LEDGER_DRAFT, "Draft"),
    (PAYMENT_LEDGER_POSTED, "Posted"),
]

# Payment status on invoice header
PAYMENT_STATUS_NOT_COMPLETED = 0
PAYMENT_STATUS_COMPLETED = 1
PAYMENT_STATUS_PARTIAL = 2

PAYMENT_STATUS_CHOICES = [
    (PAYMENT_STATUS_NOT_COMPLETED, "Not completed"),
    (PAYMENT_STATUS_COMPLETED, "Completed"),
    (PAYMENT_STATUS_PARTIAL, "Partial"),
]
