# To-Do & Habit Tracker App

Bu loyiha — oddiy, ammo kuchli **To-Do ro'yxati** va **Habit Tracker** (odatni shakllantirish jadvali) birlashtirilgan veb-ilova. HTML, CSS va JavaScript (vanilla JS) yordamida yaratilgan, hech qanday framework ishlatilmagan. Ma'lumotlar brauzerning **localStorage**'ida saqlanadi.

### Asosiy funksiyalar

- Vazifalar qo'shish, tahrirlash, o'chirish va bajarilgan deb belgilash
- Vazifalarga **kategoriya**, **prioritet**, **muddat (due date)**, **eslatma vaqti** va **takrorlanish turi** (daily, weekly, monthly) qo'shish
- **Real vaqt rejimida** Habit Tracker jadvali (bugun + keyingi kunlar/haftalar/oy kunlari)
- Jadvalda har bir kunni bosib ✅/❌ qo'yish mumkin (interaktiv)
- Bajarilgan vazifaning **aniq vaqti** saqlanadi va ko'rsatiladi (masalan: "Bajarilgan vaqti: 12-fev 09:45")
- Qidiruv, saralash (sana/prioritet bo'yicha), filtrlar (hammasi/bajarilmagan/bajarilgan), yashirish
- Dark/Light mode (tungi rejim)
- Umumiy statistika + Pie Chart + Bar Chart (Chart.js orqali)
- Haftalik va oylik statistika jadvali
- Barcha ma'lumotlarni **CSV faylga eksport** qilish
- Brauzer bildirishnomalari (notification) va ovozli eslatma

### Texnologiyalar

- HTML5
- CSS3 (CSS variables + dark mode)
- Vanilla JavaScript (ES6+)
- Chart.js (statistika diagrammalari uchun)
- Font Awesome (ikonalar)
- LocalStorage (ma'lumot saqlash)

Hech qanday backend yoki server kerak emas — hammasi brauzerda ishlaydi.

### O'rnatish va ishlatish

1. Repositoryni yuklab oling yoki klonlang:
   ```bash
   git clone https://github.com/yourusername/todo-habit-tracker.git