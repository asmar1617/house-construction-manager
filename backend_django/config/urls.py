from django.conf import settings
from django.conf.urls.static import static
from django.contrib import admin
from django.http import HttpResponse
from django.urls import path, include
def spa_serve(request, path=None):
    """Serve React build index.html for SPA (so frontend and backend run from runserver)."""
    index_path = settings.FRONTEND_BUILD_DIR / "index.html"
    if not index_path.exists():
        return HttpResponse(
            "Frontend not built. Run: cd frontend && npm install && npm run build",
            status=503,
            content_type="text/plain",
        )
    return HttpResponse(index_path.read_bytes(), content_type="text/html")

urlpatterns = [
    path("admin/", admin.site.urls),
    path("api/", include("core.urls")),
    path("", spa_serve),
    path("<path:path>", spa_serve),
]

if settings.DEBUG:
    urlpatterns += static(settings.MEDIA_URL, document_root=settings.MEDIA_ROOT)
    # Serve React build static files at /static/
    if settings.FRONTEND_BUILD_DIR.joinpath("static").exists():
        urlpatterns += static(
            "/static/",
            document_root=settings.FRONTEND_BUILD_DIR / "static",
        )
