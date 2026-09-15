from django.core.exceptions import ValidationError

def validate_rating(value):
    if value < 1 or value > 5:
        raise ValidationError("Rating must be between 1 and 5.")
