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

## Free deployment

- Use SQLite (default); no DB host needed.
- Set `DEBUG=False`, `DJANGO_SECRET_KEY`, `ALLOWED_HOSTS`, `CORS_ORIGINS` in env.
- Deploy to Render, Railway, or PythonAnywhere; point frontend `REACT_APP_API_URL` to your API URL.
