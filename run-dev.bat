@echo off
echo Starting development mode (auto-refresh on frontend changes).
echo.
echo Backend (Django) will run in a NEW window.
echo Frontend (React) will run HERE. Open http://localhost:3000 when it's ready.
echo.
start "Django backend" cmd /k "cd /d "%~dp0backend_django" && python manage.py runserver"
timeout /t 2 /nobreak >nul
echo Starting React dev server...
cd /d "%~dp0frontend"
call npm start
