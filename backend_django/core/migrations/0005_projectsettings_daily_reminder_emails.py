# Generated migration for daily reminder emails

from django.db import migrations, models


class Migration(migrations.Migration):

    dependencies = [
        ("core", "0004_alter_expense_client_comment"),
    ]

    operations = [
        migrations.AddField(
            model_name="projectsettings",
            name="daily_reminder_emails",
            field=models.CharField(blank=True, max_length=500),
        ),
    ]
