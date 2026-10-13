"""
Завантажує фото та оновлює HTML-файли сайту Last Bite.
Запуск: python _download_images.py
Фото: Unsplash (безкоштовно, Creative Commons Zero)
"""
import urllib.request, os, re, shutil

BASE = os.path.dirname(os.path.abspath(__file__))
IMG_DIR = os.path.join(BASE, "assets", "img")
os.makedirs(IMG_DIR, exist_ok=True)

HEADERS = {"User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) Chrome/120"}
UNS = "https://images.unsplash.com/"

IMAGES = {
    # Головна
    "hero-burger.jpg":        UNS + "photo-1568901346375-23c9450c58cd?w=1200&q=82&auto=format&fit=crop",
    # Бургери
    "dish-last-bite.jpg":     UNS + "photo-1553979459-d2229ba7433b?w=600&q=80&auto=format&fit=crop",
    "dish-classic.jpg":       UNS + "photo-1568901346375-23c9450c58cd?w=600&q=80&auto=format&fit=crop",
    "dish-bbq.jpg":           UNS + "photo-1582196016237-02b96d2f72e4?w=600&q=80&auto=format&fit=crop",
    "dish-pulled-pork.jpg":   UNS + "photo-1572802419509-d6dc0b7f2d4c?w=600&q=80&auto=format&fit=crop",
    "dish-veggie.jpg":        UNS + "photo-1512621776951-a57141f2eefd?w=600&q=80&auto=format&fit=crop",
    # Курка
    "dish-chilli-chicken.jpg":UNS + "photo-1606755962773-d324e0a13086?w=600&q=80&auto=format&fit=crop",
    "dish-tenders.jpg":       UNS + "photo-1585325701792-0432e41ddf9e?w=600&q=80&auto=format&fit=crop",
    "dish-wings.jpg":         UNS + "photo-1527477396000-e27163b481c2?w=600&q=80&auto=format&fit=crop",
    # Сайди
    "dish-fries.jpg":         UNS + "photo-1573080496219-bb080dd4f877?w=600&q=80&auto=format&fit=crop",
    "dish-loaded-fries.jpg":  UNS + "photo-1619474024780-badd9b01b3a8?w=600&q=80&auto=format&fit=crop",
    "dish-poutine.jpg":       UNS + "photo-1586190848861-99aa4a171e90?w=600&q=80&auto=format&fit=crop",
    "dish-onion-rings.jpg":   UNS + "photo-1580252520720-8b1ec88f0f2d?w=600&q=80&auto=format&fit=crop",
    "dish-slaw.jpg":          UNS + "photo-1512058454905-6b841e7ad132?w=600&q=80&auto=format&fit=crop",
    # Напої
    "dish-shake.jpg":         UNS + "photo-1568901839119-631418a3910d?w=600&q=80&auto=format&fit=crop",
    "dish-choc-shake.jpg":    UNS + "photo-1572490122132-bb8756bc7f66?w=600&q=80&auto=format&fit=crop",
    "dish-cola.jpg":          UNS + "photo-1606168094336-48f8c4a12f97?w=600&q=80&auto=format&fit=crop",
    "dish-lemonade.jpg":      UNS + "photo-1621506289-f598af7ec74a?w=600&q=80&auto=format&fit=crop",
    # Десерти
    "dish-cookie.jpg":        UNS + "photo-1558961363-b4aba37b1ca2?w=600&q=80&auto=format&fit=crop",
    "dish-brownie.jpg":       UNS + "photo-1564355808539-beefb463c57e?w=600&q=80&auto=format&fit=crop",
    # Соуси (один для всіх соусів)
    "dish-sauce.jpg":         UNS + "photo-1615485290382-441e4d049cb5?w=600&q=80&auto=format&fit=crop",
    # Салати
    "dish-salad.jpg":         UNS + "photo-1546069901-ba9599a7e63c?w=600&q=80&auto=format&fit=crop",
    # Комбо
    "dish-combo.jpg":         UNS + "photo-1594212699903-ec8a3eca50f5?w=600&q=80&auto=format&fit=crop",
    # Секція конструктора
    "section-builder.jpg":    UNS + "photo-1550547660-d9450f859349?w=900&q=80&auto=format&fit=crop",
}

print("=== Завантаження фото ===")
ok_count = 0
for filename, url in IMAGES.items():
    dest = os.path.join(IMG_DIR, filename)
    print(f"  {filename}...", end=" ", flush=True)
    try:
        req = urllib.request.Request(url, headers=HEADERS)
        with urllib.request.urlopen(req, timeout=30) as r, open(dest, "wb") as f:
            f.write(r.read())
        print(f"OK ({os.path.getsize(dest)//1024} KB)")
        ok_count += 1
    except Exception as e:
        print(f"ПОМИЛКА: {e}")

print(f"\nЗавантажено {ok_count}/{len(IMAGES)} фото\n")

# ─── Оновлення index.html ───────────────────────────────────────────────────

def img_tag(src, alt, extra=""):
    return f'<img src="{src}" alt="{alt}" loading="lazy"{extra}>'

def replace_thumb(html, item_id, img_file, alt, base="assets/img/"):
    # Знаходимо article з data-item="item_id" і замінюємо <div class="thumb"...>...</div>
    pattern = rf'(<article[^>]*data-item="{item_id}"[^>]*>.*?<div class="thumb"[^>]*>)(.*?)(</div>)'
    def repl(m):
        return m.group(1) + img_tag(base + img_file, alt) + m.group(3)
    return re.sub(pattern, repl, html, flags=re.DOTALL)

# --- Головна index.html ---
print("=== Оновлення index.html ===")
idx_path = os.path.join(BASE, "index.html")
with open(idx_path, encoding="utf-8") as f:
    html = f.read()

# Hero: замінюємо SVG бургер на фото
hero_new = (
    '<div class="hero-visual">\n'
    '<img src="assets/img/hero-burger.jpg" class="hero-img" '
    'alt="Juicy Last Bite burger" width="560" height="420" loading="eager">\n'
    '</div>'
)
html = re.sub(
    r'<div class="hero-visual">.*?</div>\s*</section>',
    hero_new + '\n</section>',
    html, flags=re.DOTALL, count=1
)

# Картки Popular right now
MAIN_ITEMS = [
    ("last-bite",    "dish-last-bite.jpg",    "The Last Bite burger"),
    ("chilli",       "dish-chilli-chicken.jpg","Chilli Chicken Burger"),
    ("fries",        "dish-fries.jpg",         "Rosemary Fries"),
    ("poutine",      "dish-poutine.jpg",       "Poutine"),
    ("shake-vanilla","dish-shake.jpg",         "Vanilla Milkshake"),
    ("combo-classic","dish-combo.jpg",         "Classic Combo"),
]
for item_id, img_file, alt in MAIN_ITEMS:
    html = replace_thumb(html, item_id, img_file, alt)

with open(idx_path, "w", encoding="utf-8") as f:
    f.write(html)
print("  index.html оновлено\n")

# --- Меню menu/index.html ---
print("=== Оновлення menu/index.html ===")
menu_path = os.path.join(BASE, "menu", "index.html")
with open(menu_path, encoding="utf-8") as f:
    html = f.read()

MENU_ITEMS = [
    ("last-bite",      "dish-last-bite.jpg",     "The Last Bite burger",      "../"),
    ("classic",        "dish-classic.jpg",        "Classic Cheeseburger",      "../"),
    ("smoky",          "dish-bbq.jpg",            "Smoky BBQ Burger",           "../"),
    ("pulled",         "dish-pulled-pork.jpg",    "Pulled Pork Burger",         "../"),
    ("green",          "dish-veggie.jpg",          "Green Machine veggie burger","../"),
    ("chilli",         "dish-chilli-chicken.jpg", "Chilli Chicken Burger",      "../"),
    ("tenders",        "dish-tenders.jpg",        "Chicken Tenders",            "../"),
    ("wings",          "dish-wings.jpg",          "Hot Wings",                  "../"),
    ("fries",          "dish-fries.jpg",          "Rosemary Fries",             "../"),
    ("loaded",         "dish-loaded-fries.jpg",   "Loaded Fries",               "../"),
    ("poutine",        "dish-poutine.jpg",        "Poutine",                    "../"),
    ("onion-rings",    "dish-onion-rings.jpg",    "Onion Rings",                "../"),
    ("slaw",           "dish-slaw.jpg",           "Slaw",                       "../"),
    ("sauce-burger",   "dish-sauce.jpg",          "Burger Sauce",               "../"),
    ("sauce-bbq",      "dish-sauce.jpg",          "Smoky BBQ Sauce",            "../"),
    ("sauce-garlic",   "dish-sauce.jpg",          "Garlic Mayo",                "../"),
    ("sauce-hot",      "dish-sauce.jpg",          "Hot Sauce",                  "../"),
    ("salad-garden",   "dish-salad.jpg",          "Garden Salad",               "../"),
    ("salad-chicken",  "dish-salad.jpg",          "Crispy Chicken Salad",       "../"),
    ("shake-vanilla",  "dish-shake.jpg",          "Vanilla Milkshake",          "../"),
    ("shake-choc",     "dish-choc-shake.jpg",     "Chocolate Milkshake",        "../"),
    ("cola",           "dish-cola.jpg",           "Cola",                       "../"),
    ("lemonade",       "dish-lemonade.jpg",       "Lemonade",                   "../"),
    ("cookie",         "dish-cookie.jpg",         "Chocolate Cookie",           "../"),
    ("brownie",        "dish-brownie.jpg",        "Brownie",                    "../"),
    ("combo-classic",  "dish-combo.jpg",          "Classic Combo",              "../"),
    ("combo-chicken",  "dish-chilli-chicken.jpg", "Chicken Combo",              "../"),
    ("combo-last",     "dish-last-bite.jpg",      "Last Bite Combo",            "../"),
]
for item_id, img_file, alt, prefix in MENU_ITEMS:
    html = replace_thumb(html, item_id, img_file, alt, base=prefix + "assets/img/")

with open(menu_path, "w", encoding="utf-8") as f:
    f.write(html)
print("  menu/index.html оновлено\n")

print("=== Готово! ===")
print("Тепер відкрий index.html у браузері — фото мають з'явитися.")
