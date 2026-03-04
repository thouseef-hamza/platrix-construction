"""Constants for companies app."""

# Company type values (IntegerField)
COMPANY_TYPE_CLIENT = 0
COMPANY_TYPE_SUPPLIER = 1
COMPANY_TYPE_SUBCONTRACTOR = 2

COMPANY_TYPE_CHOICES = [
    (COMPANY_TYPE_CLIENT, "Client"),
    (COMPANY_TYPE_SUPPLIER, "Supplier"),
    (COMPANY_TYPE_SUBCONTRACTOR, "Subcontractor"),
]
