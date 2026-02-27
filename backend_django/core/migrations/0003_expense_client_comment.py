from django.db import migrations, models


class Migration(migrations.Migration):

    dependencies = [
        ("core", "0002_set_target_budget_zero"),
    ]

    operations = [
        migrations.AddField(
            model_name="expense",
            name="client_comment",
            field=models.TextField(blank=True, default=""),
        ),
    ]
