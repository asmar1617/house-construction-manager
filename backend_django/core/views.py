import csv
from decimal import Decimal
from django.db.models import Sum
from django.http import HttpResponse
from rest_framework import status, generics
from rest_framework.decorators import api_view, permission_classes
from rest_framework.permissions import AllowAny, IsAuthenticated
from rest_framework.response import Response
from rest_framework_simplejwt.tokens import RefreshToken

from .models import Category, Expense, FundEntry, ProjectSettings
from .serializers import (
    CategorySerializer,
    ExpenseSerializer,
    FundEntrySerializer,
    ProjectSettingsSerializer,
    BudgetSummarySerializer,
)
from .permissions import IsAdminOrReadOnly


@api_view(["GET"])
@permission_classes([AllowAny])
def health(request):
    """No DB; use this to verify API is up and CORS works from the frontend."""
    return Response({"status": "ok"})


@api_view(["GET"])
@permission_classes([AllowAny])
def debug_db(request):
    """Return which database Django is using (to verify DATABASE_URL / Neon). Safe to remove later."""
    from django.conf import settings
    db = settings.DATABASES["default"]
    engine = db.get("ENGINE", "")
    host = db.get("HOST", "") or ""
    if host and db.get("PASSWORD"):
        host = host[:50] + "..." if len(host) > 50 else host  # don't expose full connection
    return Response({
        "engine": engine.split(".")[-1] if engine else "unknown",
        "host": host or "(sqlite)",
        "name": db.get("NAME", ""),
    })


def _is_admin(user):
    if not user or not user.is_authenticated:
        return False
    if getattr(user, "profile", None):
        return user.profile.is_admin
    return getattr(user, "is_superuser", False) or getattr(user, "is_staff", False)


def _is_viewer(user):
    return user and user.is_authenticated and not _is_admin(user)


def get_budget_summary():
    settings = ProjectSettings.get()
    target = settings.target_budget
    funds_added = FundEntry.objects.aggregate(s=Sum("amount"))["s"] or Decimal("0")
    total_available = target + funds_added
    agg = Expense.objects.filter(deleted=False).aggregate(
        total=Sum("amount"), count=Sum("amount")  # count via len
    )
    total_spent = agg["total"] or Decimal("0")
    expense_count = Expense.objects.filter(deleted=False).count()
    remaining = total_available - total_spent
    spent_percent = (total_spent / total_available * 100) if total_available else Decimal("0")
    category_totals = {}
    for row in Expense.objects.filter(deleted=False).values("category__name").annotate(s=Sum("amount")):
        name = row["category__name"] or "Other"
        category_totals[name] = row["s"] or Decimal("0")
    return {
        "target_budget": target,
        "funds_added": funds_added,
        "total_available": total_available,
        "total_spent": total_spent,
        "remaining": remaining,
        "expense_count": expense_count,
        "spent_percent": round(spent_percent, 2),
        "category_totals": category_totals,
    }


# ----- Auth -----
@api_view(["POST"])
@permission_classes([AllowAny])
def login(request):
    from django.contrib.auth import authenticate
    username = request.data.get("username")
    password = request.data.get("password")
    if not username or not password:
        return Response({"detail": "Username and password required"}, status=status.HTTP_400_BAD_REQUEST)
    user = authenticate(request, username=username, password=password)
    if not user:
        return Response({"detail": "Invalid credentials"}, status=status.HTTP_401_UNAUTHORIZED)
    refresh = RefreshToken.for_user(user)
    profile = getattr(user, "profile", None)
    role = profile.role if profile else ("admin" if user.is_superuser else "viewer")
    return Response({
        "token": str(refresh.access_token),
        "refresh": str(refresh),
        "user": {
            "id": user.id,
            "username": user.username,
            "role": role,
            "is_superuser": getattr(user, "is_superuser", False),
        },
    })


@api_view(["GET"])
@permission_classes([IsAuthenticated])
def auth_me(request):
    """Return current user info from JWT. Use this to sync role on app load."""
    user = request.user
    profile = getattr(user, "profile", None)
    role = profile.role if profile else ("admin" if user.is_superuser else "viewer")
    return Response({
        "user": {
            "id": user.id,
            "username": user.username,
            "role": role,
            "is_superuser": getattr(user, "is_superuser", False),
        },
    })


# ----- Settings (editable project title, budget label, target budget) -----
@api_view(["GET", "PATCH"])
@permission_classes([AllowAny])
def settings_view(request):
    if request.method == "GET":
        obj = ProjectSettings.get()
        return Response(ProjectSettingsSerializer(obj).data)
    if request.method == "PATCH":
        if request.user.is_authenticated and not getattr(getattr(request.user, "profile", None), "is_admin", False) and not request.user.is_superuser:
            return Response({"detail": "Admin only"}, status=status.HTTP_403_FORBIDDEN)
        obj = ProjectSettings.get()
        s = ProjectSettingsSerializer(obj, data=request.data, partial=True)
        s.is_valid(raise_exception=True)
        s.save()
        return Response(s.data)
    return Response(status=status.HTTP_405_METHOD_NOT_ALLOWED)


# ----- Budget summary -----
@api_view(["GET"])
@permission_classes([AllowAny])
def budget_summary(request):
    return Response(get_budget_summary())


# ----- Budget: set target (admin), add fund (admin), list funds -----
@api_view(["POST"])
@permission_classes([AllowAny])
def budget_set_target(request):
    if request.user.is_authenticated and not getattr(getattr(request.user, "profile", None), "is_admin", False) and not request.user.is_superuser:
        return Response({"detail": "Admin only"}, status=status.HTTP_403_FORBIDDEN)
    amount = request.data.get("target_budget")
    if amount is None:
        return Response({"detail": "target_budget required"}, status=status.HTTP_400_BAD_REQUEST)
    try:
        value = Decimal(str(amount))
        if value < 0:
            raise ValueError("must be >= 0")
    except Exception:
        return Response({"detail": "Invalid amount"}, status=status.HTTP_400_BAD_REQUEST)
    obj = ProjectSettings.get()
    obj.target_budget = value
    obj.save()
    return Response(ProjectSettingsSerializer(obj).data)


@api_view(["GET", "POST"])
@permission_classes([AllowAny])
def fund_list_or_add(request):
    if request.method == "GET":
        entries = FundEntry.objects.all()[:200]
        return Response(FundEntrySerializer(entries, many=True).data)
    if request.method == "POST":
        if request.user.is_authenticated and not getattr(getattr(request.user, "profile", None), "is_admin", False) and not request.user.is_superuser:
            return Response({"detail": "Admin only"}, status=status.HTTP_403_FORBIDDEN)
        amount = request.data.get("amount")
        if amount is None:
            return Response({"detail": "amount required"}, status=status.HTTP_400_BAD_REQUEST)
        try:
            value = Decimal(str(amount))
            if value <= 0:
                raise ValueError("must be > 0")
        except Exception:
            return Response({"detail": "Invalid amount"}, status=status.HTTP_400_BAD_REQUEST)
        entry = FundEntry.objects.create(amount=value)
        return Response(FundEntrySerializer(entry).data, status=status.HTTP_201_CREATED)
    return Response(status=status.HTTP_405_METHOD_NOT_ALLOWED)


@api_view(["GET", "DELETE"])
@permission_classes([AllowAny])
def fund_detail(request, pk):
    """Get or delete a single fund entry (e.g. to remove a mistaken entry)."""
    try:
        entry = FundEntry.objects.get(pk=pk)
    except FundEntry.DoesNotExist:
        return Response({"detail": "Not found"}, status=status.HTTP_404_NOT_FOUND)
    if request.method == "GET":
        return Response(FundEntrySerializer(entry).data)
    if request.method == "DELETE":
        entry.delete()
        return Response(status=status.HTTP_204_NO_CONTENT)
    return Response(status=status.HTTP_405_METHOD_NOT_ALLOWED)


# ----- Categories -----
class CategoryListCreate(generics.ListCreateAPIView):
    queryset = Category.objects.all()
    serializer_class = CategorySerializer
    permission_classes = [AllowAny]


class CategoryDetail(generics.RetrieveUpdateDestroyAPIView):
    queryset = Category.objects.all()
    serializer_class = CategorySerializer
    permission_classes = [AllowAny]


# ----- Expenses -----
class ExpenseListCreate(generics.ListCreateAPIView):
    serializer_class = ExpenseSerializer
    permission_classes = [AllowAny]

    def get_queryset(self):
        qs = Expense.objects.filter(deleted=False).select_related("category")
        cat = self.request.query_params.get("category")
        if cat:
            qs = qs.filter(category_id=cat)
        return qs.order_by("-date")

    def perform_create(self, serializer):
        if not _is_admin(self.request.user):
            from rest_framework.exceptions import PermissionDenied
            raise PermissionDenied("Only admin can add expenses.")
        serializer.save()


class ExpenseDetail(generics.RetrieveUpdateDestroyAPIView):
    queryset = Expense.objects.select_related("category")
    serializer_class = ExpenseSerializer
    permission_classes = [AllowAny]

    def update(self, request, *args, **kwargs):
        if not _is_admin(request.user):
            return Response({"detail": "Only admin can update expense."}, status=status.HTTP_403_FORBIDDEN)
        return super().update(request, *args, **kwargs)

    def partial_update(self, request, *args, **kwargs):
        instance = self.get_object()
        # Anyone (including unauthenticated) can set only client_comment (client view)
        data_keys = set(request.data.keys()) - {"client_comment"}
        if not data_keys and "client_comment" in request.data:
            instance.client_comment = request.data.get("client_comment") or ""
            instance.save(update_fields=["client_comment"])
            return Response(ExpenseSerializer(instance).data)
        if _is_viewer(request.user):
            comment = request.data.get("client_comment")
            if "client_comment" in request.data:
                instance.client_comment = comment if comment is not None else ""
                instance.save(update_fields=["client_comment"])
                return Response(ExpenseSerializer(instance).data)
            return Response(ExpenseSerializer(instance).data)
        if not _is_admin(request.user):
            return Response({"detail": "Only client_comment can be updated without admin login."}, status=status.HTTP_403_FORBIDDEN)
        return super().partial_update(request, *args, **kwargs)

    def perform_destroy(self, instance):
        if not _is_admin(self.request.user):
            from rest_framework.exceptions import PermissionDenied
            raise PermissionDenied("Only admin can delete expenses.")
        instance.deleted = True
        instance.save()



@api_view(["POST"])
@permission_classes([AllowAny])
def expense_undo_delete(request, pk):
    if request.user.is_authenticated and not getattr(getattr(request.user, "profile", None), "is_admin", False) and not request.user.is_superuser:
        return Response({"detail": "Admin only"}, status=status.HTTP_403_FORBIDDEN)
    try:
        exp = Expense.objects.get(pk=pk)
    except Expense.DoesNotExist:
        return Response({"detail": "Not found"}, status=status.HTTP_404_NOT_FOUND)
    exp.deleted = False
    exp.save()
    return Response(ExpenseSerializer(exp).data)


# ----- Export CSV -----
@api_view(["GET"])
@permission_classes([AllowAny])
def export_expenses_csv(request):
    expenses = Expense.objects.filter(deleted=False).select_related("category").order_by("-date")
    response = HttpResponse(content_type="text/csv")
    response["Content-Disposition"] = 'attachment; filename="expenses.csv"'
    writer = csv.writer(response)
    writer.writerow(["Date", "Amount (PKR)", "Description", "Category", "Notes", "Client comment", "Receipt URL"])
    for e in expenses:
        writer.writerow([
            e.date.isoformat(),
            str(e.amount),
            e.description,
            e.category.name if e.category_id else "",
            e.notes or "",
            getattr(e, "client_comment", "") or "",
            request.build_absolute_uri(e.image.url) if e.image else "",
        ])
    return response
