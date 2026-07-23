from rest_framework import viewsets, permissions
from .models import SavedOutfit, FeedbackEntry, ProductCache, WardrobeItem
from .serializers import SavedOutfitSerializer, FeedbackEntrySerializer, ProductCacheSerializer, WardrobeItemSerializer


class SavedOutfitViewSet(viewsets.ModelViewSet):
    """
    CRUD for a user's saved styling results.
    The actual styling generation happens in the FastAPI ai_service —
    the React frontend calls /api/style there first, then POSTs the
    result here only if the user taps "save".
    """
    serializer_class = SavedOutfitSerializer
    permission_classes = [permissions.IsAuthenticated]

    def get_queryset(self):
        return SavedOutfit.objects.filter(user=self.request.user)

    def perform_create(self, serializer):
        serializer.save(user=self.request.user)


class FeedbackEntryViewSet(viewsets.ModelViewSet):
    serializer_class = FeedbackEntrySerializer
    permission_classes = [permissions.IsAuthenticated]

    def get_queryset(self):
        return FeedbackEntry.objects.filter(user=self.request.user)

    def perform_create(self, serializer):
        serializer.save(user=self.request.user)


class ProductCacheViewSet(viewsets.ReadOnlyModelViewSet):
    """Read-only — populated by a background sync job from the ai_service's scrape cache."""
    queryset = ProductCache.objects.all().order_by("-fetched_at")
    serializer_class = ProductCacheSerializer
    permission_classes = [permissions.AllowAny]


class WardrobeItemViewSet(viewsets.ModelViewSet):
    """
    Full CRUD for wardrobe items.
    GET    /api/wardrobe/          — list all items
    POST   /api/wardrobe/          — add new item
    GET    /api/wardrobe/{id}/     — retrieve one
    PATCH  /api/wardrobe/{id}/     — update
    DELETE /api/wardrobe/{id}/     — remove
    """
    serializer_class   = WardrobeItemSerializer
    permission_classes = [permissions.IsAuthenticated]

    def get_queryset(self):
        qs = WardrobeItem.objects.filter(user=self.request.user)
        category = self.request.query_params.get("category")
        if category:
            qs = qs.filter(category=category)
        return qs

    def perform_create(self, serializer):
        serializer.save(user=self.request.user)
