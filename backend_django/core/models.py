from decimal import Decimal
from django.db import models
from django.conf import settings


class Profile(models.Model):
    class Role(models.TextChoices):
        ADMIN = "admin", "Admin"
        VIEWER = "viewer", "Viewer"

    user = models.OneToOneField(settings.AUTH_USER_MODEL, on_delete=models.CASCADE, related_name="profile")
    role = models.CharField(max_length=10, choices=Role.choices, default=Role.VIEWER)

    def __str__(self):
        return f"{self.user.username} ({self.role})"

    @property
    def is_admin(self):
        return self.role == self.Role.ADMIN or self.user.is_superuser


class ProjectSettings(models.Model):
    """Single row: project title, budget label, target budget."""
    project_title = models.CharField(max_length=200, default="Home Construction Project")
    budget_label = models.CharField(max_length=100, default="Total Budget")
    target_budget = models.DecimalField(max_digits=14, decimal_places=2, default=Decimal("0"))

    class Meta:
        verbose_name_plural = "Project settings"

    @classmethod
    def get(cls):
        obj, _ = cls.objects.get_or_create(pk=1)
        return obj


class FundEntry(models.Model):
    """Add funds entries; total available = target_budget + sum(fund_entries)."""
    amount = models.DecimalField(max_digits=14, decimal_places=2)
    date = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ["-date"]
        verbose_name_plural = "Fund entries"


class Category(models.Model):
    name = models.CharField(max_length=100, unique=True)

    class Meta:
        ordering = ["name"]
        verbose_name_plural = "Categories"

    def __str__(self):
        return self.name


class Expense(models.Model):
    amount = models.DecimalField(max_digits=14, decimal_places=2)
    description = models.CharField(max_length=255)
    date = models.DateField()
    category = models.ForeignKey(Category, on_delete=models.PROTECT, related_name="expenses")
    notes = models.TextField(blank=True)
    image = models.ImageField(upload_to="expenses/", blank=True, null=True)
    deleted = models.BooleanField(default=False)
    # Comment from client (viewer) e.g. where money was spent
    client_comment = models.TextField(blank=True)

    class Meta:
        ordering = ["-date"]

    def __str__(self):
        return f"{self.description} - Rs.{self.amount}"
