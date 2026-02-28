# Backend API (Django)

API for the Construction Cost Manager. For **run** and **deploy** see the [project README](../README.md).

## Setup (first time)

```bash
pip install -r requirements.txt
python manage.py migrate
python manage.py createsuperuser
python manage.py set_admin your_username
```

## API Endpoints

| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/api/auth/login/` | Login → JWT + user role |
| GET | `/api/auth/me/` | Current user (auth required) |
| GET/PATCH | `/api/settings/` | Project title, budget (PATCH admin only) |
| GET | `/api/budget/summary/` | Totals, remaining, category breakdown |
| POST | `/api/budget/set-target/` | Set target budget (admin only) |
| GET/POST | `/api/budget/funds/` | List / add fund entries |
| GET/POST | `/api/categories/` | List / create categories |
| GET/PUT/DELETE | `/api/categories/<id>/` | Category detail (admin only) |
| GET/POST | `/api/expenses/` | List / create expenses (?category=id) |
| GET/PUT/PATCH/DELETE | `/api/expenses/<id>/` | Expense detail (viewers can PATCH `client_comment` only) |
| POST | `/api/expenses/<id>/undo/` | Undo soft-delete (admin only) |
| GET | `/api/export/expenses/` | CSV download |

## Daily reminder email

- **Command:** `python manage.py send_daily_expense_reminder` (run daily via cron/Task Scheduler).
- **Recipients:** Users with role Viewer + email set; plus `Project settings → Daily reminder emails` (comma-separated).
- **Production:** Set `EMAIL_BACKEND`, `EMAIL_HOST`, `EMAIL_HOST_USER`, `EMAIL_HOST_PASSWORD`, `DEFAULT_FROM_EMAIL`, `BASE_URL` in env.
