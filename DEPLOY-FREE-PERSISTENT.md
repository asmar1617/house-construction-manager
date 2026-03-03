# Deploy with free tiers and persistent data

Your **expenses and login** are stored in a **database**. On Render’s free tier with SQLite, that database lives on the app’s disk and can be **wiped** when the app sleeps or redeploys.

To keep your data **even with no traffic for weeks**, use a **separate, persistent database** and (optionally) a different backend host. Below are **free-tier** options. Frontend can stay on **Vercel**.

---

## Neon + Render (keep Render, add Neon for data)

Use **Neon** as the database and keep your backend on **Render**. Data lives in Neon and persists even when the Render service sleeps or has no traffic for weeks.

### 1. Create the database (Neon)

1. Go to **[neon.tech](https://neon.tech)** → Sign up (e.g. with GitHub).
2. **New project** → name it (e.g. `construction-db`) → Create.
3. On the project dashboard, open **Connection string** and copy the **URI** (e.g. `postgresql://user:pass@ep-xxx.region.aws.neon.tech/neondb?sslmode=require`).  
   If the URL doesn’t already include `?sslmode=require`, add it. Keep this for the next step.

### 2. Point Render to Neon

1. In **Render** → your backend service → **Environment**.
2. Add a new variable:
   - **Key:** `DATABASE_URL`
   - **Value:** *(paste the full Neon connection string from step 1)*
3. **Save Changes**. Render will redeploy.

On the next deploy, the app will use **Neon** instead of SQLite: migrations run against Neon, and all new data (expenses, users) is stored there. Your existing SQLite data on Render is no longer used; if you had data there, it stays on the old disk unless you migrate it.

### 3. Create superuser (first time)

After the first deploy with `DATABASE_URL` set, create an admin user either:

- **Option A — Env vars (no Shell):** Add these to **Environment** on Render, then redeploy once:
  - `DJANGO_SUPERUSER_USERNAME` = *(e.g. admin)*
  - `DJANGO_SUPERUSER_PASSWORD` = *(your chosen password)*
  - `DJANGO_SUPERUSER_EMAIL` = *(e.g. admin@example.com)*  
  And use this **Start Command** (so the superuser is created on start if missing):
  ```bash
  cd backend_django && python manage.py migrate --noinput && (python manage.py createsuperuser --noinput 2>/dev/null || true) && gunicorn config.wsgi:application
  ```
- **Option B — Shell:** In Render → your service → **Shell**, run:
  ```bash
  cd backend_django && python manage.py createsuperuser
  ```

You keep using the same Render URL for the API; only the database changes to Neon. No need to change Vercel or `REACT_APP_API_URL`.

---

## Option A: Neon (database) + Railway (backend)

- **Neon**: Free PostgreSQL, **no expiry**, 0.5 GB storage. Data persists.
- **Railway**: Free tier (monthly credit). Runs your Django app. Data lives in Neon, not on Railway’s disk.

### 1. Create the database (Neon)

1. Go to **[neon.tech](https://neon.tech)** → Sign up (e.g. with GitHub).
2. **New project** → name it (e.g. `construction-db`) → Create.
3. On the project dashboard, open **Connection string** and copy the **URI** (e.g. `postgresql://user:pass@ep-xxx.region.aws.neon.tech/neondb?sslmode=require`).  
   Keep this for the next step.

### 2. Deploy the backend (Railway)

1. Go to **[railway.app](https://railway.app)** → Sign up (e.g. with GitHub).
2. **New Project** → **Deploy from GitHub repo** → select **house-construction-manager**.
3. After the repo is added, click the new **service** → **Settings**:
   - **Root Directory:** `backend_django`
   - **Build Command:** `pip install -r requirements.txt && python manage.py collectstatic --noinput`
   - **Start Command:** `python manage.py migrate --noinput && (python manage.py createsuperuser --noinput 2>/dev/null || true) && gunicorn config.wsgi:application`
4. **Variables** (add each):
   - `DEBUG` = `False`
   - `DJANGO_SECRET_KEY` = (generate a long random string, e.g. [djecrety.ir](https://djecrety.ir/))
   - `DATABASE_URL` = *(paste the full Neon connection string from step 1)*
   - `ALLOWED_HOSTS` = *(the host of your Railway URL only, e.g. `house-construction-manager-production.up.railway.app` — no `https://`)*
   - `DJANGO_SUPERUSER_USERNAME` = *(e.g. admin)*
   - `DJANGO_SUPERUSER_PASSWORD` = *(your chosen admin password)*
   - `DJANGO_SUPERUSER_EMAIL` = *(e.g. admin@example.com)*
5. **Settings** → **Networking** → **Generate domain**. Note the URL (e.g. `https://house-construction-manager-production.up.railway.app`).
6. Redeploy so migrations run and the superuser is created in Neon.

### 3. Frontend (Vercel)

- In **Vercel** → your project → **Settings** → **Environment Variables**:
  - `REACT_APP_API_URL` = `https://your-railway-url.up.railway.app/api` *(no trailing slash)*
- **Redeploy** the frontend so it uses the new API URL.

### 4. CORS

- In **Railway** → your service → **Variables** add (if needed):
  - `CORS_ALLOW_ALL_ORIGINS` = `1`  
  or set `CORS_ORIGINS` to your Vercel URL.

Your data (expenses, users) is now in **Neon** and persists even if the Railway app sleeps or you don’t use the app for a long time.

---

## Option B: Fly.io (backend + Postgres on one platform)

- **Fly.io**: Free allowance; run Django and PostgreSQL with **persistent volumes**. Data survives restarts.

### 1. Install Fly CLI and sign up

- Install: **[fly.io/docs/hands-on/install-flyctl](https://fly.io/docs/hands-on/install-flyctl)**  
- Run `fly auth signup` or `fly auth login`.

### 2. Create a Postgres database

```bash
fly postgres create --name construction-db --region lax
```

When prompted, save the password. Then create a database for the app:

```bash
fly postgres connect -a construction-db
```

In the Postgres shell:

```sql
CREATE DATABASE construction;
\q
```

Attach the Postgres app to your Django app (see step 3) or note the connection string from `fly postgres config -a construction-db` and set it as `DATABASE_URL`.

### 3. Deploy the Django app

From your repo root:

```bash
cd house-construction-manager
fly launch --no-deploy
```

When asked, **do not** create a new Postgres (you already did). After `fly launch`:

- Set **Root Directory** to `backend_django` in `fly.toml` or via dashboard.
- Set secrets (env vars):

```bash
fly secrets set DJANGO_SECRET_KEY=your-secret-key
fly secrets set DATABASE_URL="postgres://..."   # from fly postgres config -a construction-db
fly secrets set ALLOWED_HOSTS="*.fly.dev,your-app.fly.dev"
fly secrets set DJANGO_SUPERUSER_USERNAME=admin
fly secrets set DJANGO_SUPERUSER_PASSWORD=your-password
fly secrets set DJANGO_SUPERUSER_EMAIL=admin@example.com
```

- In `fly.toml` (or via dashboard) set:
  - **Build command:** `pip install -r requirements.txt && python manage.py collectstatic --noinput`
  - **Start command:** `python manage.py migrate --noinput && (python manage.py createsuperuser --noinput 2>/dev/null || true) && gunicorn config.wsgi:application`

Then:

```bash
fly deploy
```

### 4. Frontend (Vercel)

- Set `REACT_APP_API_URL` to `https://your-app.fly.dev/api` and redeploy.

Data is stored in Fly Postgres on a **persistent volume**, so it is kept even with no traffic for a long time.

---

## Summary

| Option              | Database        | Backend  | Data when no traffic for weeks? |
|---------------------|-----------------|----------|----------------------------------|
| Render + SQLite     | On app disk     | Render   | No (can be wiped)                 |
| **Neon + Render**   | Neon (Postgres) | Render   | Yes                              |
| **Neon + Railway**  | Neon (Postgres) | Railway  | Yes                              |
| **Fly.io**          | Fly Postgres    | Fly.io   | Yes                              |

Use **Neon + Render** if you want to keep your current Render backend and only add a persistent database. Use **Neon + Railway** or **Fly.io** if you prefer to move the backend off Render.

Frontend stays on **Vercel** in both options; only the backend and database change.
