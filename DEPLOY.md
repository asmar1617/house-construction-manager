# Deployment: Vercel (frontend) + Render (backend)

Do **Part 1** first (backend), then **Part 2** (frontend). At the end, set CORS so the frontend can call the API.

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
     cd backend_django && gunicorn config.wsgi:application
     ```

5. **Environment variables** (Add one by one):

   | Key | Value |
   |-----|--------|
   | `DEBUG` | `False` |
   | `DJANGO_SECRET_KEY` | Create a long random string (e.g. [generate](https://djecrety.ir/) or use a password generator) |
   | `ALLOWED_HOSTS` | `construction-api.onrender.com` *(replace with your service name if different)* |
   | `CORS_ORIGINS` | Leave empty for now; add your Vercel URL after Part 2 |
   | `BASE_URL` | `https://construction-api.onrender.com` *(your Render service URL)* |

6. Click **Create Web Service**. Wait for the first deploy (may take a few minutes).

7. **Run migrations (first time):**  
   In Render → your service → **Shell** tab (or use a one-off job), run:
   ```bash
   cd backend_django && python manage.py migrate
   ```
   Then create an admin user:
   ```bash
   python manage.py createsuperuser
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
