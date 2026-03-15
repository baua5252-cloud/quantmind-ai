import io
import csv
from typing import Optional
from fastapi import UploadFile

MAX_EXTRACT_CHARS = 30000


async def extract_text(file: UploadFile) -> str:
    """Extract text from uploaded file based on content type."""
    content = await file.read()
    filename = file.filename or ""
    ext = filename.rsplit(".", 1)[-1].lower() if "." in filename else ""

    if ext == "pdf":
        return _extract_pdf(content)
    elif ext == "docx":
        return _extract_docx(content)
    elif ext in ("csv",):
        return _extract_csv(content)
    elif ext in ("xlsx", "xls"):
        return _extract_excel(content)
    elif ext in ("png", "jpg", "jpeg", "gif", "webp", "bmp"):
        return _extract_image(content)
    elif ext in ("txt", "md", "json", "py", "js", "ts", "html", "css"):
        return content.decode("utf-8", errors="replace")[:MAX_EXTRACT_CHARS]
    else:
        return content.decode("utf-8", errors="replace")[:MAX_EXTRACT_CHARS]


def _extract_pdf(content: bytes) -> str:
    try:
        from PyPDF2 import PdfReader
        reader = PdfReader(io.BytesIO(content))
        pages = []
        for page in reader.pages:
            text = page.extract_text()
            if text:
                pages.append(text)
        return "\n\n".join(pages)[:MAX_EXTRACT_CHARS]
    except Exception as e:
        return f"Error extracting PDF: {e}"


def _extract_docx(content: bytes) -> str:
    try:
        from docx import Document
        doc = Document(io.BytesIO(content))
        paragraphs = [p.text for p in doc.paragraphs if p.text.strip()]
        return "\n\n".join(paragraphs)[:MAX_EXTRACT_CHARS]
    except Exception as e:
        return f"Error extracting DOCX: {e}"


def _extract_csv(content: bytes) -> str:
    try:
        text = content.decode("utf-8", errors="replace")
        reader = csv.reader(io.StringIO(text))
        rows = []
        for i, row in enumerate(reader):
            if i > 500:
                rows.append("... (truncated)")
                break
            rows.append(" | ".join(row))
        return "\n".join(rows)[:MAX_EXTRACT_CHARS]
    except Exception as e:
        return f"Error extracting CSV: {e}"


def _extract_excel(content: bytes) -> str:
    try:
        import pandas as pd
        df = pd.read_excel(io.BytesIO(content), engine="openpyxl")
        return df.head(500).to_string()[:MAX_EXTRACT_CHARS]
    except Exception as e:
        return f"Error extracting Excel: {e}"


def _extract_image(content: bytes) -> str:
    try:
        from PIL import Image
        img = Image.open(io.BytesIO(content))
        return f"[Image: {img.format} {img.size[0]}x{img.size[1]}px, mode={img.mode}. OCR not available — describe the image to the user if prompted.]"
    except Exception as e:
        return f"Error processing image: {e}"
