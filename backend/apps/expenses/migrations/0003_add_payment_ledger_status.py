# Generated manually for payment ledger status

from django.db import migrations, models


class Migration(migrations.Migration):

    dependencies = [
        (
            "expenses",
            "0002_rename_expenses_exp_account_ix1_expenses_ex_account_d1696f_idx_and_more",
        ),
    ]

    operations = [
        migrations.AddField(
            model_name="expensepayment",
            name="status",
            field=models.IntegerField(
                choices=[(0, "Draft"), (1, "Posted")],
                db_index=True,
                default=0,
            ),
        ),
    ]
