# 🚀 PWA Tezkor Boshlash

## 1️⃣ Iconlarni Yaratish (5 daqiqa)

```bash
# generate-icons.html ni brauzerda oching
open generate-icons.html
```

1. "Iconlarni Yaratish" tugmasini bosing
2. Har bir iconni o'ng tugma → "Save image as..."
3. `public/` papkasiga saqlang

**Kerakli fayllar:**
- icon-72.png
- icon-96.png
- icon-128.png
- icon-144.png
- icon-152.png
- icon-192.png
- icon-384.png
- icon-512.png
- icon-maskable-192.png
- icon-maskable-512.png
- apple-touch-icon.png
- favicon-16x16.png
- favicon-32x32.png

## 2️⃣ Test Qilish

```bash
npm run dev
```

1. http://localhost:3000 ga kiring
2. Header'dagi Download iconni ko'ring
3. F12 → Application → Service Workers
4. F12 → Application → Manifest

## 3️⃣ Deploy

```bash
npm run build
vercel --prod
```

## ✅ Tayyor!

PWA to'liq ishlaydi:
- ✅ O'rnatish buttoni
- ✅ Offline rejim
- ✅ Avtomatik yangilanish
- ✅ Push notifications
- ✅ Cache strategiyalari

## 📱 Foydalanuvchi Uchun

### Android
Header → Download icon → O'rnatish

### iOS
Safari → Share → Add to Home Screen

### Desktop
Address bar → Install icon → Install

---

**Batafsil:** PWA-GUIDE.md ni o'qing
