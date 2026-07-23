from django.contrib import admin
from .models import SavedOutfit, FeedbackEntry, ProductCache

admin.site.register(SavedOutfit)
admin.site.register(FeedbackEntry)
admin.site.register(ProductCache)
