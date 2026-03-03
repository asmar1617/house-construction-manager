from django.urls import path
from . import views

urlpatterns = [
    path("health/", views.health),
    path("debug-db/", views.debug_db),
    path("auth/login/", views.login),
    path("auth/me/", views.auth_me),
    path("settings/", views.settings_view),
    path("budget/summary/", views.budget_summary),
    path("budget/set-target/", views.budget_set_target),
    path("budget/funds/", views.fund_list_or_add),
    path("budget/funds/<int:pk>/", views.fund_detail),
    path("categories/", views.CategoryListCreate.as_view()),
    path("categories/<int:pk>/", views.CategoryDetail.as_view()),
    path("expenses/", views.ExpenseListCreate.as_view()),
    path("expenses/<int:pk>/", views.ExpenseDetail.as_view()),
    path("expenses/<int:pk>/undo/", views.expense_undo_delete),
    path("export/expenses/", views.export_expenses_csv),
]
