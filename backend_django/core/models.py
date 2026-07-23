from django.conf import settings
from django.db import models


class SavedOutfit(models.Model):
    """A styling result the user chose to save."""
    user        = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.CASCADE, related_name="outfits")
    occasion    = models.CharField(max_length=200)
    style_pref  = models.CharField(max_length=200, default="frocks")
    budget      = models.PositiveIntegerField()
    notes       = models.TextField(blank=True)
    tips        = models.TextField(blank=True)
    products_json = models.JSONField(default=list)
    image_url   = models.URLField(max_length=600, blank=True)  # Optional persisted outfit image
    created_at  = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ["-created_at"]

    def __str__(self):
        return f"{self.occasion} (₹{self.budget}) — {self.user}"


class FeedbackEntry(models.Model):
    """
    One lookbook coordination check.
    Images are uploaded to Cloudinary (free tier, 25 GB).
    cloudinary_storage handles the upload; we store the resulting URL.
    """
    user       = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.CASCADE, related_name="feedback_entries")
    # Up to 4 uploaded images, stored as Cloudinary URLs in a JSON list
    image_urls = models.JSONField(default=list)
    verdict    = models.CharField(max_length=300, blank=True)
    notes_json = models.JSONField(default=list)
    fix        = models.CharField(max_length=300, blank=True)
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ["-created_at"]
        verbose_name_plural = "feedback entries"


class ProductCache(models.Model):
    """Mirrors the ai_service scrape cache into the DB."""
    platform   = models.CharField(max_length=40)
    query      = models.CharField(max_length=300)
    title      = models.CharField(max_length=300)
    price      = models.CharField(max_length=60)
    url        = models.URLField(max_length=600)
    fetched_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        indexes = [models.Index(fields=["platform", "query"])]


class WardrobeItem(models.Model):
    """
    A single clothing/accessory item in the user's wardrobe.
    Uploaded once, referenced every time they ask for outfit suggestions.
    """
    CATEGORY_CHOICES = [
        ("top",       "Top / Shirt / Blouse"),
        ("bottom",    "Bottom / Pants / Skirt"),
        ("dress",     "Dress / Frock"),
        ("outerwear", "Jacket / Blazer / Coat"),
        ("footwear",  "Shoes / Sandals / Heels"),
        ("accessory", "Jewellery / Belt / Bag"),
        ("ethnic",    "Ethnic / Saree / Kurta"),
        ("other",     "Other"),
    ]

    user        = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.CASCADE, related_name="wardrobe")
    name        = models.CharField(max_length=200)           # e.g. "White cotton shirt"
    category    = models.CharField(max_length=20, choices=CATEGORY_CHOICES)
    color       = models.CharField(max_length=100, blank=True)  # e.g. "white", "navy blue"
    occasion    = models.CharField(max_length=200, blank=True)  # e.g. "casual", "formal", "party"
    notes       = models.TextField(blank=True)               # any extra details
    image_url   = models.URLField(max_length=600, blank=True) # Cloudinary URL
    created_at  = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ["category", "name"]

    def __str__(self):
        return f"{self.name} ({self.category}) — {self.user}"
