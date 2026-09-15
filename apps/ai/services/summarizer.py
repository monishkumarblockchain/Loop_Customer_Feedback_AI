def summarize(text):
    clean = " ".join(text.split())
    if len(clean) <= 240:
        return clean
    return clean[:237] + "..."
