@echo off
echo Building frontend...
cd /d "%~dp0frontend"
set REACT_APP_API_URL=/api
call npm run build
if errorlevel 1 (
  echo Frontend build failed. Run: cd frontend ^&^& npm install ^&^& npm run build
  exit /b 1
)
echo Starting Django (frontend + API at http://127.0.0.1:8000/)...
cd /d "%~dp0backend_django"
python manage.py runserver
