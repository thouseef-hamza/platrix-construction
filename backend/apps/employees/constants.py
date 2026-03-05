# Sponsorship: 0 = Company, 1 = Family, 2 = Transfer
SPONSORSHIP_COMPANY = 0
SPONSORSHIP_FAMILY = 1
SPONSORSHIP_TRANSFER = 2
SPONSORSHIP_CHOICES = [
    (SPONSORSHIP_COMPANY, "Company"),
    (SPONSORSHIP_FAMILY, "Family"),
    (SPONSORSHIP_TRANSFER, "Transfer"),
]

# Employment type: 0 = Permanent, 1 = Contract, 2 = Temporary
EMPLOYMENT_TYPE_PERMANENT = 0
EMPLOYMENT_TYPE_CONTRACT = 1
EMPLOYMENT_TYPE_TEMPORARY = 2
EMPLOYMENT_TYPE_CHOICES = [
    (EMPLOYMENT_TYPE_PERMANENT, "Permanent"),
    (EMPLOYMENT_TYPE_CONTRACT, "Contract"),
    (EMPLOYMENT_TYPE_TEMPORARY, "Temporary"),
]

# Employment status: 0 = Active, 1 = On Leave, 2 = Terminated
EMPLOYMENT_STATUS_ACTIVE = 0
EMPLOYMENT_STATUS_ON_LEAVE = 1
EMPLOYMENT_STATUS_TERMINATED = 2
EMPLOYMENT_STATUS_CHOICES = [
    (EMPLOYMENT_STATUS_ACTIVE, "Active"),
    (EMPLOYMENT_STATUS_ON_LEAVE, "On Leave"),
    (EMPLOYMENT_STATUS_TERMINATED, "Terminated"),
]

GENDER_CHOICES = [
    ("male", "Male"),
    ("female", "Female"),
    ("other", "Other"),
]

MARITAL_STATUS_CHOICES = [
    ("single", "Single"),
    ("married", "Married"),
    ("divorced", "Divorced"),
    ("widowed", "Widowed"),
]

# Salary entry status: 0 = Draft, 1 = Posted
SALARY_ENTRY_STATUS_DRAFT = 0
SALARY_ENTRY_STATUS_POSTED = 1
SALARY_ENTRY_STATUS_CHOICES = [
    (SALARY_ENTRY_STATUS_DRAFT, "Draft"),
    (SALARY_ENTRY_STATUS_POSTED, "Posted"),
]

# Payment method: 0 = Cash, 1 = Bank
PAYMENT_METHOD_CASH = 0
PAYMENT_METHOD_BANK = 1
PAYMENT_METHOD_CHOICES = [
    (PAYMENT_METHOD_CASH, "Cash"),
    (PAYMENT_METHOD_BANK, "Bank"),
]
