"""
Seed chart of accounts from JSON for one or more tenant Accounts.
Idempotent: only creates accounts that do not already exist (by account + code).
"""
import json
from pathlib import Path

from .models import ChartOfAccount


def get_seed_data_path():
    """Path to chart_of_accounts_seed.json in this app."""
    return Path(__file__).resolve().parent / "chart_of_accounts_seed.json"


def load_seed_data():
    """Load and return the list of seed account dicts (code, name, account_type, parent_code)."""
    path = get_seed_data_path()
    with open(path, encoding="utf-8") as f:
        return json.load(f)


def seed_chart_of_accounts(accounts):
    """
    For each Account in `accounts`, create ChartOfAccount rows from the seed JSON
    that do not already exist for that account (by code). Safe to run multiple times.

    :param accounts: Iterable of Account instances (or single Account)
    :return: Number of ChartOfAccount rows created across all accounts
    """
    try:
        account_list = list(accounts)
    except TypeError:
        account_list = [accounts]
    if not account_list:
        return 0

    data = load_seed_data()
    created = 0
    for account in account_list:
        created += _seed_for_account(account, data)
    return created


def _seed_for_account(account, data):
    """Create missing seed accounts for a single Account. Returns count created."""
    existing_codes = set(
        ChartOfAccount.objects.filter(account=account).values_list("code", flat=True)
    )
    code_to_coa = {}  # code -> ChartOfAccount instance for this account
    created = 0
    for item in data:
        code = item["code"]
        if code in existing_codes:
            coa = ChartOfAccount.objects.get(account=account, code=code)
            code_to_coa[code] = coa
            continue
        parent_code = item.get("parent_code")
        parent = code_to_coa.get(parent_code) if parent_code else None
        coa = ChartOfAccount.objects.create(
            account=account,
            code=code,
            name=item["name"],
            account_type=item["account_type"],
            parent=parent,
            is_active=True,
            is_system=True,
        )
        code_to_coa[code] = coa
        existing_codes.add(code)
        created += 1
    return created
