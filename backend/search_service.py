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
        Fallback search method using DuckDuckGo HTML scraping with improved parsing
        """
        try:
            from bs4 import BeautifulSoup
            
            encoded_query = quote_plus(query)
            
            # Try multiple DuckDuckGo endpoints
            urls_to_try = [
                f"https://html.duckduckgo.com/html/?q={encoded_query}",
                f"https://lite.duckduckgo.com/lite/?q={encoded_query}",
            ]
            
            for url in urls_to_try:
                try:
                    print(f"[DEBUG] Trying search URL: {url}")
                    response = self.session.get(url, timeout=15)
                    response.raise_for_status()
                    
                    soup = BeautifulSoup(response.content, 'html.parser')
                    results = []
                    
                    # Try multiple CSS selectors for different DuckDuckGo layouts
                    selectors_to_try = [
                        ('div.result', 'a.result__a', 'a.result__snippet'),
                        ('div.web-result', 'h2 a', '.result__snippet'),  
                        ('div[class*="result"]', 'a[href]', '.snippet'),
                        ('tr', 'a.result-link', '.result-snippet'),  # For lite version
                        ('table tr', 'a[href*="uddg"]', 'td.result-snippet'),  # Alternative lite
                    ]
                    
                    for result_selector, title_selector, snippet_selector in selectors_to_try:
                        result_divs = soup.select(result_selector)
                        if result_divs:
                            print(f"[DEBUG] Found {len(result_divs)} results using selector: {result_selector}")
                            
                            for result_div in result_divs[:max_results]:
                                title_elem = result_div.select_one(title_selector)
                                snippet_elem = result_div.select_one(snippet_selector)
                                
                                if title_elem and title_elem.get('href'):
                                    title = title_elem.get_text(strip=True)
                                    url = title_elem.get('href', '')
                                    snippet = snippet_elem.get_text(strip=True) if snippet_elem else title
                                    
                                    # Clean up DuckDuckGo redirect URLs
                                    if 'uddg=' in url:
                                        url = url.split('uddg=')[1] if 'uddg=' in url else url
                                    
                                    if title and url:
                                        results.append(SearchResult(
                                            title=title[:200],  # Limit title length
                                            url=url,
                                            snippet=snippet[:300],  # Limit snippet length
                                            source="DuckDuckGo Web"
                                        ))
                            
                            if results:
                                print(f"[DEBUG] Successfully extracted {len(results)} search results")
                                return results[:max_results]
                    
                except Exception as e:
                    print(f"[DEBUG] Failed to get results from {url}: {e}")
                    continue
            
            # If all URLs failed, return a helpful fallback
            print(f"[DEBUG] All search methods failed for query: {query}")
            return self._create_synthetic_results(query)
            
        except Exception as e:
            logger.error(f"Complete fallback search error: {e}")
            return self._create_synthetic_results(query)
    
    def _create_synthetic_results(self, query: str) -> List[SearchResult]:
        """
        Create helpful synthetic results when search fails
        """
        return [
            SearchResult(
                title=f"Search for: {query}",
                url="https://duckduckgo.com/?q=" + quote_plus(query),
                snippet=f"I wasn't able to find web search results for '{query}'. This might be due to search service limitations. You can try rephrasing your question or searching directly on DuckDuckGo.",
                source="Fallback"
            ),
            SearchResult(
                title="Alternative: Try a more specific search",
                url="https://duckduckgo.com/",
                snippet="For better results, try breaking down your question into smaller, more specific searches. For example, instead of asking about all states, try searching for specific regions or topics.",
                source="Suggestion"
            )
        ]

    async def search(self, query: str, max_results: int = 5) -> List[Dict]:
        """
        Main search method - returns search results as dictionaries
        """
        print(f"[SEARCH] Main search method called with query: '{query}', max_results: {max_results}")
        if not query.strip():
            print(f"[SEARCH] Empty query, returning empty list")
            return []
        
        results = await self.search_duckduckgo(query, max_results)
        print(f"[SEARCH] search_duckduckgo returned {len(results)} results")
        dict_results = [result.to_dict() for result in results]
        print(f"[SEARCH] Converted to {len(dict_results)} dictionary results")
        return dict_results

# Global search service instance
search_service = SearchService()