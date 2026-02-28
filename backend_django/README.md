# Construction Cost Manager – Django API

Backend for the Construction Cost Manager (PKR, admin/viewer roles, free-host friendly).

## Setup

```bash
cd backend_django
pip install -r requirements.txt
cp .env.example .env
python manage.py migrate
python manage.py createsuperuser
python manage.py set_admin
```

## Run (frontend + backend with one command)

From the **project root** (`house-construction-manager/`):

- **Windows:** `run.bat` — builds the React app, then starts Django.
- **Mac/Linux:** `./run.sh` — same.

Or manually:

1. Build frontend: `cd frontend && npm install && npm run build`
2. Start Django: `cd backend_django && python manage.py runserver`

Then open **http://127.0.0.1:8000/** — you get the React app and the API from the same server.

**Client view (view-only + comment):** Share **http://127.0.0.1:8000/client** with your client. They must log in with a **viewer** account (create a user in Django admin and leave their Profile role as "Viewer", or new users get viewer by default). Clients can only see expenses and add/edit a comment per expense (e.g. where money was spent).

- App (SPA): http://127.0.0.1:8000/
- API: http://127.0.0.1:8000/api/
- Admin: http://127.0.0.1:8000/admin/

## Endpoints

- `POST /api/auth/login/` – body: `{ "username", "password" }` → `{ "token", "user": { "role": "admin"|"viewer" } }`
- `GET/PATCH /api/settings/` – project title, budget label, target budget (PATCH admin only)
- `GET /api/budget/summary/` – totals, remaining, category breakdown
- `POST /api/budget/set-target/` – body: `{ "target_budget" }` (admin only)
- `GET/POST /api/budget/funds/` – list fund entries / add fund (POST admin only)
- `GET/POST /api/categories/` – list/create (POST admin only)
- `PUT/DELETE /api/categories/<id>/` – update/delete (admin only)
- `GET/POST /api/expenses/` – list/create (POST admin only), ?category=<id>
- `GET/PUT/DELETE /api/expenses/<id>/` – get/update/soft-delete (admin only). **Viewers** can `PATCH` with only `client_comment` to add/update a comment on an expense.
- `POST /api/expenses/<id>/undo/` – undo soft-delete (admin only)
- `GET /api/export/expenses/` – CSV download

## Daily reminder email (client notification)

The app can send a **daily email** to clients (viewers) reminding them to check that day’s expenses.

**Who receives it**

- Every user with **Profile role = Viewer** who has an **email** set (in Django admin → Users).
- Any extra addresses in **Project settings** → **Daily reminder emails** (comma-separated).

**Run the reminder (once per day)**

```bash
cd backend_django
python manage.py send_daily_expense_reminder
```

- **Test without sending:** `python manage.py send_daily_expense_reminder --dry-run`

**Schedule it (run every day)**

- **Windows:** Task Scheduler – create a daily task that runs the command above (e.g. 8:00 PM).
- **Linux/Mac:** Add to crontab, e.g. daily at 20:00:  
  `0 20 * * * cd /path/to/backend_django && python manage.py send_daily_expense_reminder`
- **Render / other hosts:** Use their cron or scheduled job feature to run the same command.

**Email configuration**

- **Development:** By default emails are **printed to the console** (no SMTP). Run the command and check the terminal.
- **Production (real email):** Set environment variables:
  - `EMAIL_BACKEND=django.core.mail.backends.smtp.EmailBackend`
  - `EMAIL_HOST`, `EMAIL_PORT`, `EMAIL_HOST_USER`, `EMAIL_HOST_PASSWORD`
  - `EMAIL_USE_TLS=true` (for port 587)
  - `DEFAULT_FROM_EMAIL` (e.g. `noreply@yourdomain.com`)
  - `BASE_URL` (e.g. `https://your-app.onrender.com`) so the link in the email is correct.

## Free deployment

- Use SQLite (default); no DB host needed.
- Set `DEBUG=False`, `DJANGO_SECRET_KEY`, `ALLOWED_HOSTS`, `CORS_ORIGINS` in env.
- Deploy to Render, Railway, or PythonAnywhere; point frontend `REACT_APP_API_URL` to your API URL.
