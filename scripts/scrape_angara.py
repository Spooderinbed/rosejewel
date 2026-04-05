import asyncio
import json
import os
import re
import aiohttp
from bs4 import BeautifulSoup
from crawl4ai import AsyncWebCrawler, CrawlerRunConfig, CacheMode

# Fix for windows encoding issues in console
import sys
if sys.platform == 'win32':
    sys.stdout.reconfigure(encoding='utf-8')

BASE_URL = "https://www.angara.com"
CATALOG_URL = f"{BASE_URL}/c/rings"
MAX_ITEMS = 40
ASSETS_DIR = os.path.join(os.path.dirname(os.path.dirname(__file__)), 'assets')

async def download_image(session, url, filepath):
    if not url.startswith('http'):
        url = 'https:' + url if url.startswith('//') else BASE_URL + url
    try:
        async with session.get(url) as response:
            if response.status == 200:
                with open(filepath, 'wb') as f:
                    f.write(await response.read())
                return True
    except Exception as e:
        print(f"Error downloading {url}: {e}")
    return False

async def crawl_catalog(crawler):
    print("Crawling catalog...")
    # wait for standard <a> tags or a product grid to load.
    config = CrawlerRunConfig(cache_mode=CacheMode.BYPASS, magic=True, wait_for="css:a[href*='/p/']")
    result = await crawler.arun(url=CATALOG_URL, config=config)
    soup = BeautifulSoup(result.html, 'html.parser')
    links = set()
    for a in soup.find_all('a', href=True):
        if '/p/' in a['href']:
            href = a['href']
            href = href if href.startswith('http') else BASE_URL + href
            links.add(href)
    print(f"Found {len(links)} product links.")
    return list(links)[:MAX_ITEMS]

def extract_price(text):
    match = re.search(r'\$?([\d,]+(\.\d{2})?)', text)
    if match:
        return float(match.group(1).replace(',', ''))
    return 1000.0

def guess_gemstone(name):
    gems = ['Diamond', 'Sapphire', 'Emerald', 'Ruby', 'Morganite', 'Aquamarine', 'Opal', 'Tanzanite', 'Garnet', 'Amethyst']
    for gem in gems:
        if gem.lower() in name.lower():
            return gem
    return 'Diamond' # Fallback

async def crawl_product(crawler, session, url, idx):
    print(f"[{idx}/{MAX_ITEMS}] Crawling {url}...")
    config = CrawlerRunConfig(cache_mode=CacheMode.BYPASS, magic=True, wait_for="css:h1")
    result = await crawler.arun(url=url, config=config)
    soup = BeautifulSoup(result.html, 'html.parser')
    
    # Extract Name
    h1 = soup.find('h1')
    name = h1.text.strip() if h1 else f"Custom Scraped Ring {idx}"
    
    # Extract Base Price
    price_val = 1500.0
    # Try multiple ways to find the price (spans with class containing 'price')
    for tag in soup.find_all('span'):
        class_str = " ".join(tag.get('class', [])).lower()
        if 'price' in class_str and '$' in tag.text:
            val = extract_price(tag.text)
            if val > 0:
                price_val = val
                break
                
    # Extract Image URLs - Filtering for actual ring shots, avoiding lifestyles
    img_urls = []
    for img in soup.find_all('img'):
        src = img.get('src') or img.get('data-src') or ''
        src_lower = src.lower()
        if not src_lower.startswith('http') and not src_lower.startswith('//'):
            continue
            
        # Target primary images, avoid hand/lifestyle/swatches/icons
        if ('/p/' in src_lower or 'product' in src_lower) and 'svg' not in src_lower:
            if 'swatch' not in src_lower and 'icon' not in src_lower and 'model' not in src_lower and 'hand' not in src_lower and 'lifestyle' not in src_lower:
                if 'thumb' not in src_lower and 'brand' not in src_lower:
                    img_urls.append(src)
    
    # De-duplicate maintaining order
    img_urls = list(dict.fromkeys(img_urls))
    
    # We want top 3 isolated ring views
    img_urls = img_urls[:3]
    local_images = []
    
    for i, img_url in enumerate(img_urls):
        ext = 'jpg' if 'jpg' in img_url.lower() else 'webp'
        filename = f"{idx}_ring_{i}.{ext}"
        filepath = os.path.join(ASSETS_DIR, filename)
        if await download_image(session, img_url, filepath):
            local_images.append(f'assets/{filename}')
            
    if not local_images:
        local_images = ["assets/cat_solitaire.png"]
        
    gemstone = guess_gemstone(name)
    
    # Extract Customizations via string pattern matching across the DOM
    html_text = result.html
    
    metals = []
    if '14K White Gold' in html_text: metals.append('14K White Gold')
    if '18K White Gold' in html_text: metals.append('18K White Gold')
    if '14K Yellow Gold' in html_text: metals.append('14K Yellow Gold')
    if '18K Yellow Gold' in html_text: metals.append('18K Yellow Gold')
    if '14K Rose Gold' in html_text: metals.append('14K Rose Gold')
    if '18K Rose Gold' in html_text: metals.append('18K Rose Gold')
    if 'Platinum' in html_text: metals.append('Platinum')
    if not metals: metals = ['14K White Gold', 'Platinum']
    
    qualities = []
    if 'Good' in html_text and 'Good (A)' in html_text: qualities.append('Good (A)')
    if 'Better' in html_text: qualities.append('Better (AA)')
    if 'Best' in html_text: qualities.append('Best (AAA)')
    if 'Heirloom' in html_text: qualities.append('Heirloom (AAAA)')
    if not qualities: qualities = ['Better (AA)', 'Best (AAA)']
    
    carats = []
    for c_val in ['0.34', '0.52', '0.70', '0.88', '1.00', '1.20', '1.50', '2.00']:
        if c_val in html_text:
            carats.append(c_val)
    if not carats: carats = ['0.52', '0.70', '1.00']
    
    # Use standard fallback properties to fill the JS schema requirement
    return {
        "id": 1000 + idx,
        "name": name,
        "sku": f"SR-CRAWL-{1000 + idx}",
        "basePrice": price_val,
        "rating": 4.5 + (idx % 5) / 10,
        "reviewCount": 15 + (idx % 20),
        "badge": "NEW ARRIVAL" if idx % 4 == 0 else ("BEST SELLER" if idx % 3 == 0 else ""),
        "gemstone": gemstone,
        "gemColor": "#4a90e2" if gemstone == 'Sapphire' else ("#009b77" if gemstone == 'Emerald' else "#cccccc"),
        "shape": "Oval" if idx % 2 == 0 else "Round",
        "style": "Solitaire" if idx % 3 == 0 else "Halo",
        "description": "Scraped product detail from Angara website. Handcrafted to your specifications.",
        "metals": metals,
        "qualities": qualities,
        "caratOptions": carats,
        "sizeOptions": [4, 4.5, 5, 5.5, 6, 6.5, 7, 7.5, 8, 8.5, 9, 9.5, 10],
        "defaultMetal": metals[0],
        "defaultQuality": qualities[-1],
        "defaultCarat": carats[len(carats)//2],
        "images": local_images,
        "swatchColors": ["#e2e6e9", "#f0e6d2", "#f5d0c5", "#e5e4e2"]
    }

async def main():
    if not os.path.exists(ASSETS_DIR):
        os.makedirs(ASSETS_DIR)
        
    print("Initializing Crawl4AI...")
    # verbose=False fixes stdout unicode errors from rich library on Windows
    async with AsyncWebCrawler(verbose=False) as crawler:
        urls = await crawl_catalog(crawler)
        if not urls:
            print("No URLs found in catalog.")
            return
            
        print(f"Starting deep crawl of {len(urls)} products...")
        rings = []
        async with aiohttp.ClientSession() as session:
            for idx, url in enumerate(urls, 1):
                ring = await crawl_product(crawler, session, url, idx)
                rings.append(ring)
                
        # Format the output into JS
        js_content = f"// AUTO-GENERATED SCAPED DATA FROM ANGARA USING CRAWL4AI\n\nconst RINGS = {json.dumps(rings, indent=2)};\n"
        # We rewrite data.js entirely with scraped rings (plus existing constants/functions)
        js_file = os.path.join(os.path.dirname(os.path.dirname(__file__)), 'js', 'scraped_data.js')
        with open(js_file, 'w', encoding='utf-8') as f:
            f.write(js_content)
            
        print(f"Successfully finished crawling {len(rings)} rings. Saved to js/scraped_data.js")

if __name__ == "__main__":
    asyncio.run(main())
