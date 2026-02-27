#!/bin/sh
set -e
cd "$(dirname "$0")"
echo "Building frontend..."
cd frontend && REACT_APP_API_URL=/api npm run build && cd ..
echo "Starting Django (frontend + API at http://127.0.0.1:8000/)..."
cd backend_django && python manage.py runserver
