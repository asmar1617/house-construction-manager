# Deployment: Vercel (frontend) + Render (backend)

Do **Part 1** first (backend), then **Part 2** (frontend). At the end, set CORS so the frontend can call the API.

**Want your data to persist when the app sleeps or has no traffic for weeks?** Keep Render and add a free **Neon** PostgreSQL database, or use another host: see **[DEPLOY-FREE-PERSISTENT.md](DEPLOY-FREE-PERSISTENT.md)** (Neon + Render, Neon + Railway, or Fly.io).

---

## Part 1: Deploy backend on Render

1. Go to **[render.com](https://render.com)** → Sign up / Log in → connect **GitHub**.

2. **Dashboard → New + → Web Service**.

3. Connect repo **asmar1617/house-construction-manager** (or your fork).

4. **Configure:**
   - **Name:** `construction-api` (or any name)
   - **Region:** choose nearest
   - **Branch:** `main`
   - **Root Directory:** leave **empty**
   - **Runtime:** **Python 3**
   - **Build Command:**
     ```bash
     cd backend_django && pip install -r requirements.txt && python manage.py collectstatic --noinput
     ```
   - **Start Command:**
     ```bash
     cd backend_django && python manage.py migrate --noinput && gunicorn config.wsgi:application
     ```

5. **Environment variables** (Add one by one):

   | Key | Value |
   |-----|--------|
   | `DEBUG` | `False` |
   | `DJANGO_SECRET_KEY` | Create a long random string (e.g. [generate](https://djecrety.ir/) or use a password generator) |
   | `ALLOWED_HOSTS` | `construction-api.onrender.com` *(replace with your service name if different)* |
   | `CORS_ORIGINS` | Optional. All `*.vercel.app` URLs (production + preview) are allowed by default. Add a comma-separated list only if you need extra origins. |
   | `BASE_URL` | `https://construction-api.onrender.com` *(your Render service URL)* |

6. Click **Create Web Service**. Wait for the first deploy (may take a few minutes).

7. **Create an admin user (first time):**  
   With the Start Command above, migrations run automatically on each deploy. In Render → your service → **Shell** tab, run:
   ```bash
   cd backend_django && python manage.py createsuperuser
   ```
   (Follow prompts. If Shell doesn’t support interactive input, create the user in Django admin after opening the API URL in the browser and adding `/admin/`.)

8. **Note your backend URL**, e.g. `https://construction-api.onrender.com`. You need it for Part 2.

---

## Part 2: Deploy frontend on Vercel

1. Go to **[vercel.com](https://vercel.com)** → Sign up / Log in → connect **GitHub**.

2. **Add New… → Project** → import **house-construction-manager**.

3. **Configure:**
   - **Root Directory:** click **Edit** → set to **`frontend`**
   - **Framework Preset:** Create React App (auto)
   - **Build Command:** `npm run build` (default)
   - **Output Directory:** `build` (default)

4. **Environment variable (required for amounts and login to work):**
   - **Name:** `REACT_APP_API_URL`
   - **Value:** `https://house-construction-manager.onrender.com/api`  
   *(Use your real Render URL with `/api` at the end, no trailing slash.)*
   - **Important:** This value is baked in at **build time**. If you add or change it later, you must **Redeploy** the frontend (Deployments → … → Redeploy). Otherwise the app will keep calling the wrong URL and amounts/login will fail.

5. Click **Deploy**. Wait for the build to finish.

6. **Note your frontend URL**, e.g. `https://house-construction-manager.vercel.app`.

---

## Part 3: Connect frontend to backend (CORS)

1. In **Render** → your **construction-api** service → **Environment**.
2. Add or edit **`CORS_ORIGINS`** and set it to your **Vercel URL** (no trailing slash), e.g.:
   ```text
   https://house-construction-manager.vercel.app
   ```
3. **Save** and let the service **redeploy** (or trigger a manual deploy).

---

## Done

- **Frontend (app):** open your Vercel URL (e.g. `https://house-construction-manager.vercel.app`).
- **Backend (API):** `https://construction-api.onrender.com/api/`
- **Django Admin:** `https://construction-api.onrender.com/admin/` (log in with the superuser you created).

If the app shows “Invalid credentials” or network errors, check that `REACT_APP_API_URL` is exactly `https://your-render-url/api` and that `CORS_ORIGINS` on Render is exactly your Vercel URL.

---

## "Failed to fetch" or CORS errors

1. **Quick fix: allow all origins (unblocks immediately)**  
   In Render → your service → **Environment** → add:
   - **Key:** `CORS_ALLOW_ALL_ORIGINS`
   - **Value:** `1`  
   **Save** and **redeploy**. The frontend should then be able to call the API. (Optional: later you can remove this and set `CORS_ORIGINS` to only your Vercel URL for tighter security.)

2. **Or set CORS to your Vercel URL only**  
   In Render → your service → **Environment** → add or edit:
   - **Key:** `CORS_ORIGINS`
   - **Value:** your **exact** Vercel URL, e.g. `https://house-construction-manager.vercel.app`  
   No trailing slash, no spaces. Then **Save** and **redeploy** the service.

3. **Backend might be sleeping (Render free tier)**  
   Free services spin down after ~15 min of no traffic. The first request after that can take 30–60 seconds and may time out. Open your **Render service URL** in a new tab (e.g. `https://house-construction-manager.onrender.com`) and wait until you see the API message. Then try logging in again from the Vercel app.

4. **Check the API URL on Vercel**  
   In Vercel → Project → **Settings** → **Environment Variables**, ensure **`REACT_APP_API_URL`** is set to `https://your-render-service.onrender.com/api` (with `/api` at the end). After changing it, **redeploy** the frontend (env vars are applied at build time).

---

## 500 errors and "Cannot connect to the API"

If the frontend shows "Cannot connect to the API" and the browser reports **500 Internal Server Error** (and sometimes CORS), the backend is crashing when handling requests. Do the following **on Render**:

### 1. Start Command must run migrations

Render only runs migrations if they are in the **Start Command**. If you created the service manually (or changed the name), the Start Command in the dashboard overrides `render.yaml`.

- In **Render** → your backend service → **Settings** → **Build & Deploy** → check **Root Directory**:
  - **If Root Directory is empty** (repo root), use:
    ```bash
    cd backend_django && python manage.py migrate --noinput && gunicorn config.wsgi:application
    ```
  - **If Root Directory is `backend_django`** (Blueprint or you set it), use (no `cd`):
    ```bash
    python manage.py migrate --noinput && gunicorn config.wsgi:application
    ```
- Paste the matching command into **Start Command** → **Save Changes** → **Manual Deploy** → **Deploy latest commit**. Wait for the deploy to finish.

### 2. ALLOWED_HOSTS must match your Render URL

- In **Render** → your service → **Environment**.
- **`ALLOWED_HOSTS`** must be the **hostname** of your backend (no `https://`, no path). Examples:
  - If your API URL is `https://house-construction-manager.onrender.com`, set:
    ```text
    house-construction-manager.onrender.com
    ```
  - If your API URL is `https://construction-api.onrender.com`, set:
    ```text
    construction-api.onrender.com
    ```
- **Save** and redeploy if you changed it.

### 3. See the real error in Render Logs

- In **Render** → your service → **Logs**.
- In another tab, open your Vercel app and refresh (or click until a request is sent).
- In the Logs tab you should see a **Python traceback** (e.g. `no such table`, `ModuleNotFoundError`, etc.). That tells you the exact fix.

### 4. Test the API with a health check (no database)

- Open in your browser: `https://your-render-url.onrender.com/api/health/`  
  (e.g. `https://house-construction-manager.onrender.com/api/health/`)
- If you see `{"status":"ok"}`, the server is up. If you still get 500 or CORS from the **Vercel app**, check Logs as in step 3 and ensure Start Command and ALLOWED_HOSTS are set as above.
