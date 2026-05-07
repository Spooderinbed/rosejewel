@echo off
REM Tsukiyo Gems - Quick Free Image Setup
REM This script downloads free ring images from Pexels and optimizes them

echo.
echo ===================================================
echo Tsukiyo Gems - Free Image Downloader
echo ===================================================
echo.
echo This will download 8 free ring images from Pexels
echo and optimize them for your website.
echo.
echo Requirements: Python 3 + Pillow (pip install Pillow)
echo.
pause

REM Create Python script inline
cd /d "%~dp0"

python.exe << 'PYTHON_EOF'
import urllib.request
import os
from PIL import Image
from io import BytesIO

ASSETS = r".\assets"
SIZE = (1200, 1200)
QUALITY = 75

# Direct Pexels image URLs
IMAGES = {
    "ring_white-band.jpg": "https://images.pexels.com/photos/9343915/pexels-photo-9343915.jpeg",
    "ring_opal-halo.jpg": "https://images.pexels.com/photos/4098370/pexels-photo-4098370.jpeg",
    "ring_tourmaline-oval.jpg": "https://images.pexels.com/photos/1927266/pexels-photo-1927266.jpeg",
    "ring_purple-amethyst.jpg": "https://images.pexels.com/photos/2799863/pexels-photo-2799863.jpeg",
    "ring_gold-skull.jpg": "https://images.pexels.com/photos/1927266/pexels-photo-1927266.jpeg",
    "ring_ruby-cluster.jpg": "https://images.pexels.com/photos/3156648/pexels-photo-3156648.jpeg",
    "ring_gold-signet.jpg": "https://images.pexels.com/photos/1927266/pexels-photo-1927266.jpeg",
    "ring_diamond-pave.jpg": "https://images.pexels.com/photos/2799863/pexels-photo-2799863.jpeg",
}

os.makedirs(ASSETS, exist_ok=True)
success = 0

for name, url in IMAGES.items():
    try:
        print(f"Downloading {name}...", end=" ", flush=True)
        req = urllib.request.Request(url, headers={'User-Agent': 'Mozilla/5.0'})

        with urllib.request.urlopen(req, timeout=15) as r:
            img = Image.open(BytesIO(r.read()))

        # Convert to RGB
        if img.mode in ("RGBA", "LA", "P"):
            bg = Image.new("RGB", img.size, (255, 255, 255))
            if img.mode == "P":
                img = img.convert("RGBA")
            bg.paste(img, mask=img.split()[-1] if img.mode in ("RGBA", "LA") else None)
            img = bg

        # Resize
        img.thumbnail(SIZE, Image.Resampling.LANCZOS)
        if img.size != SIZE:
            new_img = Image.new("RGB", SIZE, (255, 255, 255))
            new_img.paste(img, ((SIZE[0]-img.size[0])//2, (SIZE[1]-img.size[1])//2))
            img = new_img

        # Save
        path = os.path.join(ASSETS, name)
        img.save(path, "JPEG", quality=QUALITY, optimize=True)
        size = os.path.getsize(path) / 1024
        print(f"OK ({size:.0f} KB)")
        success += 1
    except Exception as e:
        print(f"SKIP - {str(e)[:30]}")

print(f"\n{success}/8 images downloaded successfully!")
print("Images saved to: ./assets/")
PYTHON_EOF

echo.
echo Done! Check the ./assets/ folder.
echo.
pause
