# Deploying This Project

This app has a **Django backend** (API + serves React build) and **React frontend**. Below: push to GitHub, then where to deploy.

---

## 1. Push to GitHub

In a terminal (PowerShell or Git Bash) from the **project root** (`house-construction-manager`):

```bash
cd E:\House_construction_managment_system\house-construction-manager

git init
git add .
git commit -m "Initial commit: Django + React construction cost manager"
```

Create a **new repository** on GitHub (github.com → New repository). Do **not** add a README or .gitignore (you already have them). Then:

```bash
git remote add origin https://github.com/YOUR_USERNAME/YOUR_REPO_NAME.git
git branch -M main
git push -u origin main
```

Replace `YOUR_USERNAME` and `YOUR_REPO_NAME` with your GitHub username and repo name.

---

## 2. Is Vercel a Good Option?

**Vercel is great for frontend-only (React/Next.js).** For this project:

- **Backend:** Django needs a Python server, a database (SQLite or PostgreSQL), and (optionally) file storage. Vercel’s serverless model doesn’t run Django in the usual way and doesn’t give you a persistent DB or filesystem.
- **So:** Using **only** Vercel for the whole app is **not** a good fit. You can use **Vercel for the React app** and run Django elsewhere (see “Split deployment” below).

---

## 3. Recommended: Render (Free & Simple)

**Render** is a good **free** option that can run both Django and a database with minimal setup.

| Feature        | Render free tier                          |
|----------------|-------------------------------------------|
| Django backend | Yes (Web Service; sleeps after ~15 min)  |
| PostgreSQL     | Yes (free DB; check current limits)       |
| Static/React   | Served by Django (build in deploy step)   |
| GitHub deploy  | Connect repo → auto deploy on push       |

**Rough steps:**

1. Sign up at [render.com](https://render.com) and connect your GitHub account.
2. **New → Web Service** and select your repo.
3. **Build command:** e.g. `cd frontend && npm install && npm run build && cd ../backend_django && pip install -r requirements.txt`
4. **Start command:** e.g. `cd backend_django && gunicorn config.wsgi:application` (you’d add `gunicorn` to `requirements.txt` and use WhiteNoise for static files).
5. **New → PostgreSQL** and create a free database; add its URL as `DATABASE_URL` in the Web Service’s environment.
6. In Django `settings.py` use `DATABASE_URL` for production (e.g. with `dj-database-url` and `psycopg2-binary`) and set `ALLOWED_HOSTS`, `SECRET_KEY`, etc. from env.

Render has a [Django deploy guide](https://render.com/docs/deploy-django); follow that and adapt build/start commands to your repo layout (frontend + `backend_django`).

---

## 4. Other Options

- **Railway** – Free tier/credits; can run Django + Postgres. Connect GitHub and deploy; similar idea to Render.
- **Split: Vercel (frontend) + Render/Railway (Django)** – Deploy the React app on Vercel and the Django API on Render (or Railway). Set the frontend’s API URL to your Django backend URL. More moving parts but keeps frontend on Vercel.

---

## 5. Summary

| Goal                         | Suggestion                                      |
|-----------------------------|--------------------------------------------------|
| Easiest single-place deploy | **Render** (Django + Postgres + same service)    |
| Frontend on Vercel          | Deploy **only** React on Vercel; Django elsewhere |
| Full app on Vercel only     | **Not recommended** (Django doesn’t fit well)   |

Push the project to GitHub first (section 1), then use Render (or Render + Vercel for frontend) for a free, relatively simple deployment.
