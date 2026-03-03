# House Construction Manager

A full-stack app to track construction budget, expenses by category, and daily spending. Built for admins (full control) and clients (view-only + comments). Includes a daily email reminder for clients to check expenses.

## Tech Stack

- **Frontend:** React, React Router, Tailwind CSS
- **Backend:** Django REST Framework, JWT (Simple JWT), SQLite (default) / PostgreSQL
- **Features:** Budget summary, categories, expenses (with images), funds, CSV export, admin/viewer roles, daily reminder email

## Quick Start (local)

**Prerequisites:** Node.js, Python 3, pip

1. **Clone and enter the repo**
   ```bash
   git clone https://github.com/asmar1617/house-construction-manager.git
   cd house-construction-manager
   ```

2. **Run the app (one command)**
   - **Windows:** `run.bat`
   - **Mac/Linux:** `chmod +x run.sh && ./run.sh`

   This builds the React app and starts Django. Open **http://127.0.0.1:8000/** in your browser.

3. **First-time setup** (no virtual environment required; use your system Python)
   ```bash
   cd backend_django
   pip install -r requirements.txt
   python manage.py migrate
   python manage.py createsuperuser
   python manage.py set_admin your_username
   ```
   Then run `run.bat` or `./run.sh` from the project root again.

- **App:** http://127.0.0.1:8000/  
- **Django Admin:** http://127.0.0.1:8000/admin/  
- **API base:** http://127.0.0.1:8000/api/

## Project Structure

```
house-construction-manager/
├── frontend/          # React app (build output served by Django in dev)
├── backend_django/    # Django API, models, migrations
├── run.bat            # Windows: build frontend + run Django
├── run.sh             # Mac/Linux: same
└── run-dev.bat        # Windows: Django + React dev server (port 3000)
```

## Daily Reminder Email

Clients (viewers) can receive a daily email reminding them to check that day’s expenses.

- **Recipients:** Any user with role **Viewer** and an email set in Django admin, plus optional addresses in **Project settings → Daily reminder emails** (comma-separated).
- **Run once:** `cd backend_django && python manage.py send_daily_expense_reminder`
- **Test (no send):** `python manage.py send_daily_expense_reminder --dry-run`
- **Schedule:** Use Task Scheduler (Windows) or cron (Linux/Mac) to run the command daily. For production, set `EMAIL_*` and `BASE_URL` env vars (see `backend_django/README.md`).

## Deployment (Vercel + Render)

**Step-by-step:** see **[DEPLOY.md](DEPLOY.md)**.

- **Backend:** [Render](https://render.com) (Web Service). Build/start commands and env vars are in DEPLOY.md. Optional: use **New → Blueprint** and connect the repo to use `render.yaml`.
- **Frontend:** [Vercel](https://vercel.com). Root Directory = `frontend`, env var `REACT_APP_API_URL` = your Render API URL + `/api`.
- **CORS:** Set `CORS_ORIGINS` on Render to your Vercel URL after both are deployed.

## License

MIT (or as you prefer)
