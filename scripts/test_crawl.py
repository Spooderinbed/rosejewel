import asyncio
import os
import re
import aiohttp
from bs4 import BeautifulSoup
from crawl4ai import AsyncWebCrawler, CrawlerRunConfig, CacheMode

async def main():
    print("Testing Crawl4AI on Angara rings catalog...")
    async with AsyncWebCrawler(verbose=True) as crawler:
        config = CrawlerRunConfig(cache_mode=CacheMode.BYPASS, wait_for="css:a[href*='/p/']")
        result = await crawler.arun(url="https://www.angara.com/c/rings", config=config)
        soup = BeautifulSoup(result.html, 'html.parser')
        links = set()
        for a in soup.find_all('a', href=True):
            if '/p/' in a['href']:
                href = a['href']
                href = href if href.startswith('http') else "https://www.angara.com" + href
                links.add(href)
        
        links = list(links)
        print(f"Found {len(links)} product links.")
        if not links:
            print(result.html[:1000])
            return
            
        # Test just the first link
        first_link = links[0]
        print(f"\nCrawling first product: {first_link}")
        config = CrawlerRunConfig(cache_mode=CacheMode.BYPASS, wait_for="css:h1")
        result = await crawler.arun(url=first_link, config=config)
        
        soup = BeautifulSoup(result.html, 'html.parser')
        h1 = soup.find('h1')
        print("H1 tag:", h1.text.strip() if h1 else "Not found")
        
        img_tags = soup.find_all('img')
        print(f"Total img tags: {len(img_tags)}")
        
        for img in img_tags:
            src = img.get('src') or img.get('data-src') or ''
            if ('product' in src.lower() or '/p/' in src.lower() or 'image' in src.lower()) and 'svg' not in src:
                print("Potential product image:", src)

if __name__ == "__main__":
    asyncio.run(main())
