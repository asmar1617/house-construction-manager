# Deploy on Vercel (Frontend) + Render (Backend)

Vercel runs the **React frontend** only. The **Django backend** must run on **Render** (or another host). You need **both** deployed and connected.

**Quick checklist:**
1. Deploy **Django on Render** (Web Service) and note the URL (e.g. `https://xxx.onrender.com`).
2. Deploy **React on Vercel** with **Root Directory** = `frontend`, and set **REACT_APP_API_URL** = `https://xxx.onrender.com/api`.
3. In Render, set **CORS_ORIGINS** = your Vercel URL (e.g. `https://your-app.vercel.app`) and redeploy.

---

## Part 1: Deploy Django backend on Render

1. Go to [render.com](https://render.com) and sign up / log in. Connect your **GitHub** account.

2. **New → Web Service**. Select your repo `house-construction-manager` (or your fork).

3. **Settings:**
   - **Name:** e.g. `construction-api`
   - **Root Directory:** leave empty (repo root)
   - **Runtime:** Python 3
   - **Build Command:** `cd backend_django && pip install -r requirements.txt`
   - **Start Command:** `cd backend_django && gunicorn config.wsgi:application`
   - (The React app is served by Vercel; Render only runs the API.)

4. **Add PostgreSQL (optional but recommended):**  
   **New → PostgreSQL** → create a free database. Copy the **Internal Database URL** (or External if you need it from outside Render).

5. **Environment variables** for the Web Service (backend_django runs here):

   | Key | Value |
   |-----|--------|
   | `DEBUG` | `False` |
   | `DJANGO_SECRET_KEY` | (generate a long random string) |
   | `ALLOWED_HOSTS` | `your-service-name.onrender.com` |
   | `CORS_ORIGINS` | `https://your-app.vercel.app` (you’ll add this after Part 2) |
   | `DATABASE_URL` | (paste from Render Postgres, if you created one) |
   | `BASE_URL` | `https://your-service-name.onrender.com` |

   If you use **SQLite** (no Postgres), don’t set `DATABASE_URL`. Render’s disk is ephemeral, so data resets on redeploy; Postgres is better for production.

6. The repo already includes **gunicorn** and **whitenoise** in `backend_django/requirements.txt`. For a database on Render, add a PostgreSQL instance and set `DATABASE_URL`; you’d then add `psycopg2-binary` and `dj-database-url` to requirements and use `DATABASE_URL` in `settings.py` (or keep SQLite for testing; note Render’s disk is ephemeral).

7. Click **Create Web Service**. Wait for the first deploy. Note the URL, e.g. `https://construction-api.onrender.com`.

8. **First-time setup on Render:**  
   In the shell (or use Render’s “Shell” tab if available), run:
   ```bash
   cd backend_django && python manage.py migrate && python manage.py createsuperuser
   ```
   (Or run migrations via a one-off job; check Render docs.)

---

## Part 2: Deploy React frontend on Vercel

1. Go to [vercel.com](https://vercel.com) and sign up / log in. Connect your **GitHub** account.

2. **Add New → Project**. Import your repo `house-construction-manager`.

3. **Configure Project:**
   - **Root Directory:** click **Edit** and set to **`frontend`** (so Vercel only builds the React app).
   - **Framework Preset:** Create React App (or leave as detected).
   - **Build Command:** `npm run build` (default).
   - **Output Directory:** `build` (default).

4. **Environment variables** (important):

   | Name | Value |
   |------|--------|
   | `REACT_APP_API_URL` | `https://your-service-name.onrender.com/api` |

   Use the **exact** backend URL from Part 1, with `/api` at the end. Example:  
   `https://construction-api.onrender.com/api`

5. Click **Deploy**. Wait for the build. Note your frontend URL, e.g. `https://house-construction-manager.vercel.app`.

6. **CORS:** Go back to **Render** → your Web Service → **Environment** and add/update:
   - `CORS_ORIGINS` = `https://house-construction-manager.vercel.app`  
   (use your real Vercel URL). Then redeploy the backend so it allows requests from the frontend.

---

## Summary

| What | Where | URL example |
|------|--------|-------------|
| React app | Vercel | `https://your-app.vercel.app` |
| Django API | Render | `https://your-api.onrender.com` |
| API base in frontend | Env var | `REACT_APP_API_URL=https://your-api.onrender.com/api` |

After both deploys, open the **Vercel URL** in the browser. The app will call the **Render** backend; login and data will work if CORS and `REACT_APP_API_URL` are set correctly.

---

## Notes

- **Backend** already uses `ALLOWED_HOSTS` and `CORS_ORIGINS` from env; set them in Render.
- **Static/Admin:** If you use Django admin on the Render URL, run `python manage.py collectstatic --noinput` in the build step (and ensure `STATIC_ROOT` / WhiteNoise are set). Optional: add `collectstatic` to the build command if you need admin static files.
