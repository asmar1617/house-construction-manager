from rest_framework import permissions


class IsAdminOrReadOnly(permissions.BasePermission):
    """Admin can do anything; viewer can only read (GET, HEAD, OPTIONS)."""

    def has_permission(self, request, view):
        if not request.user or not request.user.is_authenticated:
            return False
        if request.method in permissions.SAFE_METHODS:
            return True
        return self._is_admin(request.user)

    def _is_admin(self, user):
        if getattr(user, "profile", None):
            return user.profile.is_admin
        return user.is_superuser or user.is_staff
