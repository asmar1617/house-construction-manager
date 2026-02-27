# Set default target budget to zero and update existing row(s)

from decimal import Decimal
from django.db import migrations, models


def set_budget_zero(apps, schema_editor):
    ProjectSettings = apps.get_model("core", "ProjectSettings")
    ProjectSettings.objects.all().update(target_budget=Decimal("0"))


def noop(apps, schema_editor):
    pass


class Migration(migrations.Migration):

    dependencies = [
        ("core", "0001_initial"),
    ]

    operations = [
        migrations.AlterField(
            model_name="projectsettings",
            name="target_budget",
            field=models.DecimalField(decimal_places=2, default=Decimal("0"), max_digits=14),
        ),
        migrations.RunPython(set_budget_zero, noop),
    ]
