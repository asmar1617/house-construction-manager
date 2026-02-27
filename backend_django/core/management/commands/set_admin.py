"""Set or create first user as admin. Usage: python manage.py set_admin [username]"""
from django.core.management.base import BaseCommand
from django.contrib.auth import get_user_model
from core.models import Profile

User = get_user_model()


class Command(BaseCommand):
    help = "Set existing user as admin by username, or create superuser as admin."

    def add_arguments(self, parser):
        parser.add_argument("username", nargs="?", help="Username to set as admin")

    def handle(self, *args, **options):
        username = options.get("username")
        if username:
            try:
                user = User.objects.get(username=username)
            except User.DoesNotExist:
                self.stdout.write(self.style.ERROR(f"User '{username}' not found."))
                return
        else:
            user = User.objects.filter(is_superuser=True).first()
            if not user:
                self.stdout.write(
                    self.style.ERROR("No superuser found. Create one with: python manage.py createsuperuser")
                )
                return
            username = user.username
        profile, created = Profile.objects.get_or_create(user=user, defaults={"role": Profile.Role.ADMIN})
        profile.role = Profile.Role.ADMIN
        profile.save()
        self.stdout.write(self.style.SUCCESS(f"User '{username}' is now admin."))
