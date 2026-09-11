export const defaultMenuCategories = [
  { slug: "coffee", name: "Coffee", displayOrder: 1 },
  { slug: "non-coffee", name: "Non-Coffee", displayOrder: 2 },
  { slug: "tea", name: "Tea & Refreshers", displayOrder: 3 },
  { slug: "breakfast", name: "Breakfast", displayOrder: 4 },
  { slug: "all-day", name: "All Day", displayOrder: 5 },
  { slug: "bakes", name: "Bakes & Dessert", displayOrder: 6 },
] as const;

/** Demo media only. Replace these with client-owned assets before production. */
export const defaultMenuImageUrls = [
  "https://images.unsplash.com/photo-1495474472287-4d71bcdd2085",
  "https://images.unsplash.com/photo-1445116572660-236099ec97a0",
  "https://images.unsplash.com/photo-1501339847302-ac426a4a7cbb",
  "https://images.unsplash.com/photo-1511081692775-05d0f180a065",
  "https://images.unsplash.com/photo-1517248135467-4c7edcad34c4",
  "https://images.unsplash.com/photo-1509042239860-f550ce710b93",
  "https://images.unsplash.com/photo-1442512595331-e89e73853f31",
  "https://images.unsplash.com/photo-1481833761820-0509d3217039",
  "https://images.unsplash.com/photo-1559925393-8be0ec4767c8",
  "https://images.unsplash.com/photo-1504674900247-0877df9cc836",
] as const;

export const defaultMenuItems = [
  { categorySlug: "coffee", name: "Kōhi Latte", slug: "kohi-latte", description: "Double espresso, silky milk, and a rounded caramel finish.", price: 38000, badge: "Best Seller", isFeatured: true, isAvailable: true, displayOrder: 1 },
  { categorySlug: "coffee", name: "Black Tonic", slug: "black-tonic", description: "Crisp tonic water, bright espresso, and a twist of orange.", price: 41000, badge: "Recommended", isFeatured: true, isAvailable: true, displayOrder: 2 },
  { categorySlug: "coffee", name: "Cappuccino", slug: "cappuccino", description: "Sweet, balanced espresso under a cloud of microfoam.", price: 35000, badge: null, isFeatured: false, isAvailable: true, displayOrder: 3 },
  { categorySlug: "coffee", name: "Oat Flat White", slug: "oat-flat-white", description: "Bold double ristretto with creamy oat milk.", price: 42000, badge: "New", isFeatured: false, isAvailable: true, displayOrder: 4 },
  { categorySlug: "coffee", name: "Yuzu Cold Brew", slug: "yuzu-cold-brew", description: "Slow-steeped coffee, yuzu, and sparkling tonic.", price: 42000, badge: "Seasonal", isFeatured: true, isAvailable: true, displayOrder: 5 },
  { categorySlug: "non-coffee", name: "Sea Salt Chocolate", slug: "sea-salt-chocolate", description: "Single-origin cacao, steamed milk, and flaky sea salt.", price: 40000, badge: null, isFeatured: true, isAvailable: true, displayOrder: 6 },
  { categorySlug: "non-coffee", name: "Strawberry Matcha", slug: "strawberry-matcha", description: "Ceremonial matcha, strawberry compote, and fresh milk.", price: 43000, badge: "New", isFeatured: false, isAvailable: true, displayOrder: 7 },
  { categorySlug: "non-coffee", name: "Malted Vanilla", slug: "malted-vanilla", description: "A comforting blend of malt, vanilla bean, and milk.", price: 36000, badge: null, isFeatured: false, isAvailable: true, displayOrder: 8 },
  { categorySlug: "tea", name: "Peach Oolong", slug: "peach-oolong", description: "Fragrant oolong tea, white peach, and citrus peel.", price: 35000, badge: null, isFeatured: false, isAvailable: true, displayOrder: 9 },
  { categorySlug: "tea", name: "Honey Citrus Tea", slug: "honey-citrus-tea", description: "Jasmine tea, local honey, lemon, and rosemary.", price: 34000, badge: null, isFeatured: false, isAvailable: true, displayOrder: 10 },
  { categorySlug: "tea", name: "Lychee Hibiscus", slug: "lychee-hibiscus", description: "Tart hibiscus, lychee, and sparkling water.", price: 36000, badge: "Recommended", isFeatured: false, isAvailable: true, displayOrder: 11 },
  { categorySlug: "breakfast", name: "Miso Butter Toast", slug: "miso-butter-toast", description: "Sourdough, cultured butter, white miso, and wildflower honey.", price: 48000, badge: "Best Seller", isFeatured: true, isAvailable: true, displayOrder: 12 },
  { categorySlug: "breakfast", name: "Soft Egg Bun", slug: "soft-egg-bun", description: "Potato bun, soft scrambled egg, cheddar, and house chili jam.", price: 58000, badge: null, isFeatured: false, isAvailable: true, displayOrder: 13 },
  { categorySlug: "breakfast", name: "Granola & Yogurt", slug: "granola-yogurt", description: "House granola, coconut yogurt, seasonal fruit, and lime.", price: 52000, badge: null, isFeatured: false, isAvailable: true, displayOrder: 14 },
  { categorySlug: "all-day", name: "Chicken Katsu Sando", slug: "chicken-katsu-sando", description: "Crisp chicken, cabbage slaw, tonkatsu mayo, and shokupan.", price: 78000, badge: "Recommended", isFeatured: true, isAvailable: true, displayOrder: 15 },
  { categorySlug: "all-day", name: "Mushroom Rice Bowl", slug: "mushroom-rice-bowl", description: "Roasted mushrooms, nori rice, edamame, and sesame dressing.", price: 72000, badge: null, isFeatured: false, isAvailable: true, displayOrder: 16 },
  { categorySlug: "all-day", name: "Spicy Prawn Pasta", slug: "spicy-prawn-pasta", description: "Prawns, cherry tomatoes, garlic, and house chili oil.", price: 89000, badge: "Spicy", isFeatured: false, isAvailable: true, displayOrder: 17 },
  { categorySlug: "bakes", name: "Basque Cheesecake", slug: "basque-cheesecake", description: "Burnished, creamy cheesecake with a whisper of vanilla.", price: 45000, badge: "Best Seller", isFeatured: true, isAvailable: true, displayOrder: 18 },
  { categorySlug: "bakes", name: "Almond Croissant", slug: "almond-croissant", description: "Buttery laminated pastry, almond cream, and toasted flakes.", price: 38000, badge: null, isFeatured: false, isAvailable: true, displayOrder: 19 },
  { categorySlug: "bakes", name: "Dark Chocolate Cookie", slug: "dark-chocolate-cookie", description: "Soft-centered 70% dark chocolate and toasted pecan cookie.", price: 28000, badge: null, isFeatured: false, isAvailable: true, displayOrder: 20 },
] as const;
