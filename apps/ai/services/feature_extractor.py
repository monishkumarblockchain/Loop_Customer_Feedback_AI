FEATURE_TERMS = ["please add", "would like", "wish", "feature", "add dark mode", "export", "integration", "support"]

def extract_feature_request(text):
    low = text.lower()
    if any(term in low for term in FEATURE_TERMS):
        return text.strip()
    return ""
