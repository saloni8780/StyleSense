from rest_framework import serializers
from .models import SavedOutfit, FeedbackEntry, ProductCache, WardrobeItem


class SavedOutfitSerializer(serializers.ModelSerializer):
    class Meta:
        model  = SavedOutfit
        fields = ["id", "occasion", "style_pref", "budget", "notes",
                  "tips", "products_json", "image_url", "created_at"]
        read_only_fields = ["id", "created_at"]


class FeedbackEntrySerializer(serializers.ModelSerializer):
    class Meta:
        model  = FeedbackEntry
        fields = ["id", "image_urls", "verdict", "notes_json", "fix", "created_at"]
        read_only_fields = ["id", "created_at"]


class ProductCacheSerializer(serializers.ModelSerializer):
    class Meta:
        model  = ProductCache
        fields = ["id", "platform", "query", "title", "price", "url", "fetched_at"]


class WardrobeItemSerializer(serializers.ModelSerializer):
    class Meta:
        model  = WardrobeItem
        fields = ["id", "name", "category", "color", "occasion",
                  "notes", "image_url", "created_at"]
        read_only_fields = ["id", "created_at"]
