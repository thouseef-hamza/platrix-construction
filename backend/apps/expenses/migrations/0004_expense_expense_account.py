# General expense: optional COA selection (default 5000, exclude 5010, 5050, 5060)

from django.db import migrations, models
import django.db.models.deletion


class Migration(migrations.Migration):

    dependencies = [
        ("accounting", "0003_initial"),
        ("expenses", "0003_add_payment_ledger_status"),
    ]

    operations = [
        migrations.AddField(
            model_name="expense",
            name="expense_account",
            field=models.ForeignKey(
                blank=True,
                null=True,
                on_delete=django.db.models.deletion.PROTECT,
                related_name="general_expenses",
                to="accounting.chartofaccount",
                db_index=True,
            ),
        ),
    ]
