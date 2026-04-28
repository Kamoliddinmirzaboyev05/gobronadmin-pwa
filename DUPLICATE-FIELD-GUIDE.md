# 📋 Maydon Nusxalash Qo'llanma

## Xususiyat

Mavjud maydondan nusxa yaratish - barcha ma'lumotlarni ko'chirib, faqat narx, rasmlar va qulayliklarni o'zgartirish.

## Qanday Ishlaydi

### 1. Nusxa Yaratish

1. **Maydonlar** sahifasiga o'ting
2. Kerakli maydon kartochkasida **"Nusxa"** tugmasini bosing
3. Forma ochiladi va barcha ma'lumotlar avtomatik to'ldiriladi

### 2. Avtomatik Ko'chiriladigan Ma'lumotlar

✅ **Ko'chiriladi:**
- Maydon nomi (+ "nusxa" qo'shimchasi)
- Tavsif
- Manzil
- Shahar
- Telefon
- Google Maps URL
- Narx (o'zgartirish kerak)
- Ish vaqti (ochilish/yopilish)
- Oldindan band qilish kunlari
- Holat (faol/nofaol)

❌ **Ko'chirilmaydi:**
- Rasmlar (keyinchalik qo'shish kerak)
- Qulayliklar (keyinchalik qo'shish kerak)

### 3. O'zgartirish Kerak Bo'lgan Ma'lumotlar

#### 🔴 Majburiy:
1. **Maydon nomi** - "(nusxa)" ni o'chirib, yangi nom yozing
2. **Narx** - Yangi narx kiriting (ko'k rangda highlight)

#### 🟡 Tavsiya etiladi:
3. **Telefon** - Agar boshqa bo'lsa
4. **Manzil** - Agar boshqa bo'lsa
5. **Google Maps** - Agar boshqa bo'lsa

### 4. Maydon Yaratish

1. Barcha kerakli ma'lumotlarni to'ldiring
2. **"Nusxa yaratish"** tugmasini bosing
3. Maydon yaratiladi

### 5. Rasmlar va Qulayliklar Qo'shish

Maydon yaratilgandan keyin:

1. Maydonni **"Tahrirlash"** qiling
2. **"Rasmlar"** tabiga o'ting
   - Muqova rasmini yuklang
   - Qo'shimcha rasmlar qo'shing
3. **"Qulayliklar"** tabiga o'ting
   - Kerakli qulayliklarni qo'shing
   - Masalan: Parking, Dush, Wi-Fi, va h.k.

## UI/UX Xususiyatlari

### 📋 Info Banner
Nusxa yaratishda ko'k banner ko'rsatiladi:
```
📋 Nusxa yaratilmoqda
"Maydon nomi" dan barcha ma'lumotlar ko'chirildi.
Narx, rasmlar va qulayliklarni o'zgartirishingiz mumkin.
```

### 💡 Narx Highlight
Narx input ko'k border va ring bilan highlight qilinadi:
```
💡 Narxni o'zgartiring
```

### 📝 Eslatma
Forma pastida eslatma:
```
📝 Eslatma:
• Maydon yaratilgandan keyin rasmlar qo'shing
• Qulayliklarni tahrirlang
• Narxni tekshiring
```

## Misol

### Birinchi Maydon:
```json
{
  "name": "Yulduz Sport Markazi",
  "address": "Chilonzor 12-kvartal",
  "city": "Toshkent",
  "price_per_hour": 100000,
  "opening_time": "08:00",
  "closing_time": "22:00",
  "phone": "+998 90 123 45 67"
}
```

### Nusxa (Avtomatik):
```json
{
  "name": "Yulduz Sport Markazi (nusxa)", // O'zgartiring!
  "address": "Chilonzor 12-kvartal",      // Bir xil
  "city": "Toshkent",                      // Bir xil
  "price_per_hour": 100000,                // O'zgartiring!
  "opening_time": "08:00",                 // Bir xil
  "closing_time": "22:00",                 // Bir xil
  "phone": "+998 90 123 45 67"            // Bir xil
}
```

### Siz O'zgartirasiz:
```json
{
  "name": "Yulduz Sport Markazi 2-filial",
  "price_per_hour": 120000,  // Yangi narx
  "phone": "+998 90 999 88 77" // Yangi telefon (agar kerak bo'lsa)
}
```

## Tugmalar

### Maydon Kartochkasida:
- **Tahrirlash** (kulrang) - Mavjud maydonni tahrirlash
- **Nusxa** (ko'k) - Nusxa yaratish
- **Toggle** (sariq/yashil) - Faol/Nofaol
- **O'chirish** (qizil) - Maydonni o'chirish

## Foydalanish Holatlari

### 1. Filiallar
Bir xil maydonning turli filliallarini yaratish:
- Yulduz Sport 1-filial
- Yulduz Sport 2-filial
- Yulduz Sport 3-filial

### 2. Turli Narxlar
Bir xil maydon, turli vaqtlarda turli narxlar:
- Kunduzgi (arzon)
- Kechki (qimmat)

### 3. Tez Yaratish
Ko'p maydonlarni tez yaratish kerak bo'lsa

## Afzalliklar

✅ **Tezlik** - 10 soniya ichida yangi maydon
✅ **Xatosizlik** - Barcha ma'lumotlar to'g'ri ko'chiriladi
✅ **Qulaylik** - Faqat kerakli joylarni o'zgartirish
✅ **Samaradorlik** - Bir necha marta yozish kerak emas

## Eslatmalar

⚠️ **Muhim:**
- Maydon nomini o'zgartiring (nusxa qo'shimchasini olib tashlang)
- Narxni tekshiring va o'zgartiring
- Rasmlar va qulayliklar avtomatik ko'chirilmaydi

💡 **Maslahat:**
- Avval bitta maydonni to'liq yarating
- Keyin undan nusxa olib, tez-tez yarating
- Har bir nusxada faqat narx va nomni o'zgartiring

---

**Yaratildi:** 2024-04-28
**Versiya:** 1.0.0
