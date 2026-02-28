"""
Send a daily email reminder to clients (viewers) to check today's expenses.
Run once per day via cron or Task Scheduler, e.g.:
  python manage.py send_daily_expense_reminder
"""
from datetime import date
from decimal import Decimal

from django.core.mail import send_mail
from django.conf import settings
from django.core.management.base import BaseCommand
from django.db.models import Sum
from django.utils import timezone

from core.models import Expense, Profile, ProjectSettings


def get_today_expense_total():
    """Today's total spent (using server timezone)."""
    today = timezone.localdate()
    result = (
        Expense.objects.filter(deleted=False, date=today).aggregate(total=Sum("amount"))["total"]
        or Decimal("0")
    )
    return result


def get_reminder_emails():
    """Collect all emails that should receive the daily reminder."""
    emails = set()
    # Viewers (clients) who have an email set
    for profile in Profile.objects.filter(role=Profile.Role.VIEWER).select_related("user"):
        if profile.user.is_active and profile.user.email and profile.user.email.strip():
            emails.add(profile.user.email.strip().lower())
    # Extra emails from project settings (comma-separated)
    proj = ProjectSettings.get()
    if proj.daily_reminder_emails:
        for part in proj.daily_reminder_emails.split(","):
            email = part.strip()
            if email and "@" in email:
                emails.add(email.lower())
    return list(emails)


class Command(BaseCommand):
    help = "Send daily email reminder to clients to check today's expenses."

    def add_arguments(self, parser):
        parser.add_argument(
            "--dry-run",
            action="store_true",
            help="Print what would be sent without sending email.",
        )

    def handle(self, *args, **options):
        dry_run = options.get("dry_run", False)
        emails = get_reminder_emails()
        if not emails:
            self.stdout.write(
                self.style.WARNING(
                    "No reminder emails configured. Add viewer users with email, or set "
                    "ProjectSettings.daily_reminder_emails (comma-separated) in Django admin."
                )
            )
            return

        total = get_today_expense_total()
        proj = ProjectSettings.get()
        project_title = proj.project_title or "Construction Cost Manager"
        base_url = getattr(settings, "BASE_URL", "http://127.0.0.1:8000").rstrip("/")

        subject = f"Reminder: Check today's expenses – {project_title}"
        body = f"""Hello,

This is your daily reminder to check today's expenses for {project_title}.

Today's spending so far: Rs. {total:,.0f}

Log in to view and add comments: {base_url}

—
This is an automated message from {project_title}."""

        if dry_run:
            self.stdout.write(f"Would send to: {emails}")
            self.stdout.write(f"Subject: {subject}")
            self.stdout.write("---")
            self.stdout.write(body)
            return

        from_email = getattr(
            settings, "DEFAULT_FROM_EMAIL", "noreply@example.com"
        )
        send_mail(
            subject=subject,
            message=body,
            from_email=from_email,
            recipient_list=emails,
            fail_silently=False,
        )
        self.stdout.write(
            self.style.SUCCESS(f"Sent daily reminder to {len(emails)} recipient(s).")
        )
