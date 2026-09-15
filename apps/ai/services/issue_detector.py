def detect_priority(sentiment, rating, text):
    low = text.lower()
    critical = ["security", "data loss", "crash", "cannot pay", "payment failed"]
    high = ["broken", "failure", "failed", "not working", "unusable"]
    if any(x in low for x in critical):
        return "CRITICAL"
    if sentiment == "NEGATIVE" and (rating <= 2 or any(x in low for x in high)):
        return "HIGH"
    if sentiment == "NEGATIVE" or rating == 3:
        return "MEDIUM"
    return "LOW"
