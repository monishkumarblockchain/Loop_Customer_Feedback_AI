def classify_feedback(text):
    text = text.lower()
    categories = {
        "PERFORMANCE": ["slow", "loading", "lag", "performance"],
        "PAYMENT": ["payment", "transaction", "billing", "checkout"],
        "AUTHENTICATION": ["login", "password", "sign in", "authentication"],
        "UI_UX": ["design", "interface", "ui", "ux", "button"],
        "SUPPORT": ["support", "customer service", "help"],
        "PRICING": ["price", "pricing", "expensive", "cost"],
        "SECURITY": ["security", "privacy", "hack"],
    }
    for category, terms in categories.items():
        if any(term in text for term in terms):
            return category
    return "GENERAL"
