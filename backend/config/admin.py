"""
Project-level admin customisation. Import this in config.urls so it runs before admin is used.
"""
from django.contrib import admin
from django.contrib.auth.models import Group

admin.site.unregister(Group)
