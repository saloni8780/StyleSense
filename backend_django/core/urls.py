from django.urls import path
from rest_framework.routers import DefaultRouter

from .views import SavedOutfitViewSet, FeedbackEntryViewSet, ProductCacheViewSet, WardrobeItemViewSet
from .auth_views import register, login_view, logout_view, me

router = DefaultRouter()
router.register("outfits",        SavedOutfitViewSet,    basename="outfit")
router.register("feedback-entries", FeedbackEntryViewSet, basename="feedback-entry")
router.register("product-cache",  ProductCacheViewSet,   basename="product-cache")
router.register("wardrobe",       WardrobeItemViewSet,   basename="wardrobe")

urlpatterns = [
    path("auth/register/", register),
    path("auth/login/",    login_view),
    path("auth/logout/",   logout_view),
    path("auth/me/",       me),
] + router.urls
