import re


def normalize_text(text: str) -> str:
    """
    Normalize extracted text safely.
    Handles None, extra newlines, and spacing issues.
    """

    if not text:
        return ""

    text = text.replace("\r", "\n")
    text = re.sub(r"\n{2,}", "\n", text)

    return text.strip()
