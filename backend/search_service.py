import requests
import json
from typing import List, Dict, Optional
from urllib.parse import quote_plus
import logging

logger = logging.getLogger(__name__)

class SearchResult:
    def __init__(self, title: str, url: str, snippet: str, source: str = ""):
        self.title = title
        self.url = url
        self.snippet = snippet
        self.source = source

    def to_dict(self) -> Dict:
        return {
            "title": self.title,
            "url": self.url,
            "snippet": self.snippet,
            "source": self.source
        }

class SearchService:
    def __init__(self):
        self.session = requests.Session()
        self.session.headers.update({
            'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
        })

    async def search_duckduckgo(self, query: str, max_results: int = 5) -> List[SearchResult]:
        """
        Search using DuckDuckGo Instant Answer API
        """
        try:
            # DuckDuckGo Instant Answer API
            encoded_query = quote_plus(query)
            url = f"https://api.duckduckgo.com/?q={encoded_query}&format=json&no_html=1&skip_disambig=1"
            
            response = self.session.get(url, timeout=10)
            response.raise_for_status()
            
            data = response.json()
            results = []
            
            # Handle instant answer
            if data.get("AbstractText"):
                results.append(SearchResult(
                    title=data.get("Heading", "DuckDuckGo Answer"),
                    url=data.get("AbstractURL", ""),
                    snippet=data.get("AbstractText", ""),
                    source="DuckDuckGo Instant Answer"
                ))
            
            # Handle related topics
            for topic in data.get("RelatedTopics", [])[:max_results-len(results)]:
                if isinstance(topic, dict) and topic.get("Text"):
                    results.append(SearchResult(
                        title=topic.get("Text", "").split(" - ")[0],
                        url=topic.get("FirstURL", ""),
                        snippet=topic.get("Text", ""),
                        source="DuckDuckGo"
                    ))
            
            # If no instant answers, try web search fallback
            if not results:
                return await self._fallback_web_search(query, max_results)
                
            return results[:max_results]
            
        except Exception as e:
            logger.error(f"DuckDuckGo search error: {e}")
            return await self._fallback_web_search(query, max_results)

    async def _fallback_web_search(self, query: str, max_results: int) -> List[SearchResult]:
        """
        Fallback search method using DuckDuckGo HTML scraping
        """
        try:
            from bs4 import BeautifulSoup
            
            encoded_query = quote_plus(query)
            url = f"https://html.duckduckgo.com/html/?q={encoded_query}"
            
            response = self.session.get(url, timeout=10)
            response.raise_for_status()
            
            soup = BeautifulSoup(response.content, 'html.parser')
            results = []
            
            # Parse search results
            for result_div in soup.find_all('div', class_='result')[:max_results]:
                title_elem = result_div.find('a', class_='result__a')
                snippet_elem = result_div.find('a', class_='result__snippet')
                
                if title_elem:
                    title = title_elem.get_text(strip=True)
                    url = title_elem.get('href', '')
                    snippet = snippet_elem.get_text(strip=True) if snippet_elem else ""
                    
                    results.append(SearchResult(
                        title=title,
                        url=url,
                        snippet=snippet,
                        source="DuckDuckGo Web"
                    ))
            
            return results
            
        except Exception as e:
            logger.error(f"Fallback search error: {e}")
            return [SearchResult(
                title="Search Error",
                url="",
                snippet=f"Unable to perform search: {str(e)}",
                source="Error"
            )]

    async def search(self, query: str, max_results: int = 5) -> List[Dict]:
        """
        Main search method - returns search results as dictionaries
        """
        if not query.strip():
            return []
        
        results = await self.search_duckduckgo(query, max_results)
        return [result.to_dict() for result in results]

# Global search service instance
search_service = SearchService()