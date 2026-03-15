import httpx
from bs4 import BeautifulSoup
from typing import List, Dict
from app.config import settings

SEARCH_RESULTS_LIMIT = 5


async def web_search(query: str) -> List[Dict[str, str]]:
    """Search the web using DuckDuckGo HTML (no API key needed)."""
    results = []
    try:
        async with httpx.AsyncClient(timeout=15.0, follow_redirects=True) as client:
            resp = await client.get(
                "https://html.duckduckgo.com/html/",
                params={"q": query},
                headers={"User-Agent": "Mozilla/5.0 (compatible; OmniMindAI/1.0)"},
            )
            resp.raise_for_status()
            soup = BeautifulSoup(resp.text, "html.parser")
            for r in soup.select(".result")[:SEARCH_RESULTS_LIMIT]:
                title_el = r.select_one(".result__title a")
                snippet_el = r.select_one(".result__snippet")
                if title_el:
                    results.append({
                        "title": title_el.get_text(strip=True),
                        "url": title_el.get("href", ""),
                        "snippet": snippet_el.get_text(strip=True) if snippet_el else "",
                    })
    except Exception:
        pass
    return results


async def fetch_page_content(url: str, max_chars: int = 4000) -> str:
    """Fetch and extract readable text from a webpage."""
    try:
        async with httpx.AsyncClient(timeout=15.0, follow_redirects=True) as client:
            resp = await client.get(
                url,
                headers={"User-Agent": "Mozilla/5.0 (compatible; OmniMindAI/1.0)"},
            )
            resp.raise_for_status()
            soup = BeautifulSoup(resp.text, "html.parser")
            for tag in soup(["script", "style", "nav", "header", "footer", "aside"]):
                tag.decompose()
            text = soup.get_text(separator="\n", strip=True)
            return text[:max_chars]
    except Exception:
        return ""


async def search_and_summarize(query: str) -> str:
    """Search the web and compile results into context for the AI."""
    results = await web_search(query)
    if not results:
        return "No web results found."

    context_parts = [f"Web search results for: '{query}'\n"]
    for i, r in enumerate(results, 1):
        context_parts.append(f"{i}. {r['title']}\n   URL: {r['url']}\n   {r['snippet']}\n")

    return "\n".join(context_parts)
