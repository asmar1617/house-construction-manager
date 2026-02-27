from decimal import Decimal
from rest_framework import serializers
from django.db.models import Sum

from .models import Category, Expense, FundEntry, ProjectSettings


class CategorySerializer(serializers.ModelSerializer):
    class Meta:
        model = Category
        fields = ["id", "name"]


class ExpenseSerializer(serializers.ModelSerializer):
    category_name = serializers.CharField(source="category.name", read_only=True)

    class Meta:
        model = Expense
        fields = [
            "id", "amount", "description", "date", "category", "category_name",
            "notes", "image", "deleted", "client_comment"
        ]
        read_only_fields = ["deleted"]


class FundEntrySerializer(serializers.ModelSerializer):
    class Meta:
        model = FundEntry
        fields = ["id", "amount", "date"]


class ProjectSettingsSerializer(serializers.ModelSerializer):
    class Meta:
        model = ProjectSettings
        fields = ["project_title", "budget_label", "target_budget"]


class BudgetSummarySerializer(serializers.Serializer):
    target_budget = serializers.DecimalField(max_digits=14, decimal_places=2)
    funds_added = serializers.DecimalField(max_digits=14, decimal_places=2)
    total_available = serializers.DecimalField(max_digits=14, decimal_places=2)
    total_spent = serializers.DecimalField(max_digits=14, decimal_places=2)
    remaining = serializers.DecimalField(max_digits=14, decimal_places=2)
    expense_count = serializers.IntegerField()
    spent_percent = serializers.DecimalField(max_digits=5, decimal_places=2)
    category_totals = serializers.DictField(child=serializers.DecimalField(max_digits=14, decimal_places=2))
