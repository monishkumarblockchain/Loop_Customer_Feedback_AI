import re

POSITIVE = {"good","great","excellent","useful","love","amazing","fast","easy","helpful","perfect","happy"}
NEGATIVE = {"bad","slow","poor","hate","terrible","problem","issue","fail","failed","failure","bug","expensive","difficult"}

def analyze_sentiment(text):
    try:
        from transformers import pipeline
        classifier = pipeline("sentiment-analysis")
        result = classifier(text[:512])[0]
        label = result["label"].upper()
        score = float(result["score"])
        if "POSITIVE" in label:
            return "POSITIVE", score
        if "NEGATIVE" in label:
            return "NEGATIVE", score
    except Exception:
        pass

    words = set(re.findall(r"[a-zA-Z]+", text.lower()))
    pos = len(words & POSITIVE)
    neg = len(words & NEGATIVE)
    if pos > neg:
        return "POSITIVE", min(0.5 + pos * 0.08, 0.99)
    if neg > pos:
        return "NEGATIVE", min(0.5 + neg * 0.08, 0.99)
    return "NEUTRAL", 0.50
