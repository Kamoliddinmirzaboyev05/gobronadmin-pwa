# Icons & Images Guide

## Required Files

Create these files for complete SEO and PWA support:

### Favicon Files
- `favicon.svg` ✅ (exists)
- `favicon-16x16.png` - 16x16px
- `favicon-32x32.png` - 32x32px

### PWA Icons
- `icon-192.png` - 192x192px (maskable)
- `icon-512.png` - 512x512px (maskable)
- `apple-touch-icon.png` - 180x180px

### Social Media
- `og-image.png` - 1200x630px (Open Graph image)
- `screenshot-mobile.png` - 390x844px (PWA screenshot)
- `screenshot-desktop.png` - 1920x1080px (PWA screenshot)

## How to Create

### Option 1: Using Figma/Canva
1. Create logo design
2. Export in required sizes
3. Use https://realfavicongenerator.net/ for favicon generation

### Option 2: Using Online Tools
- **Favicon Generator**: https://realfavicongenerator.net/
- **PWA Icons**: https://www.pwabuilder.com/imageGenerator
- **OG Image**: https://www.opengraph.xyz/

### Option 3: Using ImageMagick (CLI)
```bash
# Convert SVG to PNG sizes
convert favicon.svg -resize 16x16 favicon-16x16.png
convert favicon.svg -resize 32x32 favicon-32x32.png
convert favicon.svg -resize 192x192 icon-192.png
convert favicon.svg -resize 512x512 icon-512.png
convert favicon.svg -resize 180x180 apple-touch-icon.png
```

## Design Guidelines

### Logo/Icon
- Simple, recognizable design
- Works well at small sizes
- Brand colors: Primary #10b981 (Emerald)
- High contrast for visibility
- Transparent or white background

### OG Image (1200x630px)
- Brand logo/name prominently displayed
- Key value proposition text
- Professional, clean design
- Readable on mobile
- Use brand colors

### Screenshots
- Show actual app interface
- Clean, professional look
- Remove sensitive data
- Show key features
- High quality (2x resolution)

## Current Status

✅ favicon.svg - Exists
❌ favicon-16x16.png - Missing
❌ favicon-32x32.png - Missing
❌ icon-192.png - Missing
❌ icon-512.png - Missing
❌ apple-touch-icon.png - Missing
❌ og-image.png - Missing (use og-image-placeholder.html as template)
❌ screenshot-mobile.png - Missing
❌ screenshot-desktop.png - Missing

## Quick Start

1. Design your logo in Figma/Canva
2. Visit https://realfavicongenerator.net/
3. Upload your logo
4. Download generated package
5. Extract files to /public folder
6. Create OG image using og-image-placeholder.html as template
7. Take screenshots of your app
8. Done! 🎉
