# Generated manually for payment ledger status

from django.db import migrations, models


class Migration(migrations.Migration):

    dependencies = [
        ("purchase", "0001_initial"),
    ]

    operations = [
        migrations.AddField(
            model_name="purchasepayment",
            name="status",
            field=models.IntegerField(
                choices=[(0, "Draft"), (1, "Posted")],
                db_index=True,
                default=0,
            ),
        ),
    ]
