const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function run() {
  console.log('🚀 Starting Database Product Catalog Population & Cleanup...');

  // 1. Ensure Top-Level Categories & Subcategories
  const topCakes = await prisma.category.upsert({
    where: { slug: 'cakes' },
    update: { name: 'Cakes', type: 'CAKE', parentId: null },
    create: { name: 'Cakes', slug: 'cakes', type: 'CAKE', parentId: null },
  });

  const topCelebration = await prisma.category.upsert({
    where: { slug: 'celebration' },
    update: { name: 'Celebration Products', type: 'CELEBRATION', parentId: null },
    create: { name: 'Celebration Products', slug: 'celebration', type: 'CELEBRATION', parentId: null },
  });

  const subcategoriesData = [
    { name: 'Birthday Cakes', slug: 'birthday-cakes', type: 'CAKE', parentId: topCakes.id },
    { name: 'Anniversary Cakes', slug: 'anniversary-cakes', type: 'CAKE', parentId: topCakes.id },
    { name: 'Occasion Cakes', slug: 'occasion-cakes', type: 'CAKE', parentId: topCakes.id },
    { name: 'Designer Cakes', slug: 'designer-cakes', type: 'CAKE', parentId: topCakes.id },
    { name: 'Bouquets & Flowers', slug: 'bouquets-flowers', type: 'CELEBRATION', parentId: topCelebration.id },
    { name: 'Gifts & Hampers', slug: 'gifts-hampers', type: 'CELEBRATION', parentId: topCelebration.id },
  ];

  const subcategoryMap = new Map();
  for (const sub of subcategoriesData) {
    const cat = await prisma.category.upsert({
      where: { slug: sub.slug },
      update: { name: sub.name, type: sub.type, parentId: sub.parentId },
      create: { name: sub.name, slug: sub.slug, type: sub.type, parentId: sub.parentId },
    });
    subcategoryMap.set(sub.slug, cat.id);
  }

  console.log('✅ Categories & Subcategories verified (6 subcategories).');

  // 2. Ensure Flavors
  const flavorList = [
    'Chocolate Truffle',
    'Black Forest',
    'Red Velvet',
    'Pineapple Fresh Cream',
    'Mango Delight',
    'Butterscotch Crunch',
    'Vanilla Bean',
    'Wild Blueberry',
    'Lotus Biscoff',
    'Hazelnut Praline',
    'Pistachio Rose',
    'Coffee Opera',
  ];

  const flavorMap = new Map();
  for (const name of flavorList) {
    const f = await prisma.flavor.upsert({
      where: { name },
      update: {},
      create: { name },
    });
    flavorMap.set(name, f.id);
  }

  console.log('✅ Flavors verified (12 flavors).');

  // 3. Remove Test / Placeholder Products
  const removeSlugs = [
    'invoice-test-cake-1785302407569',
    'invoice-test-cake-1785046630169',
    'cake-1',
  ];

  for (const slug of removeSlugs) {
    const prods = await prisma.product.findMany({ where: { slug } });
    for (const p of prods) {
      await prisma.variant.deleteMany({ where: { productId: p.id } });
      await prisma.product.delete({ where: { id: p.id } });
      console.log(`🗑️ Removed placeholder product: ${p.name} (${slug})`);
    }
  }

  // Also clean up soft-deleted products
  const deletedProds = await prisma.product.findMany({ where: { isDeleted: true } });
  for (const p of deletedProds) {
    await prisma.variant.deleteMany({ where: { productId: p.id } });
    await prisma.product.delete({ where: { id: p.id } });
    console.log(`🗑️ Removed soft-deleted product: ${p.name} (${p.id})`);
  }

  // 4. Products Master Data (25 Realistic Products)
  const catalog = [
    // BIRTHDAY CAKES (7 products)
    {
      name: 'Signature Belgian Dark Chocolate Truffle Cake',
      slug: 'belgian-chocolate-truffle-cake',
      categorySlug: 'birthday-cakes',
      flavorName: 'Chocolate Truffle',
      description: 'Indulge in our flagship 100% eggless dark Belgian chocolate truffle cake. Layers of dense moist cocoa sponge smothered with rich 70% dark chocolate ganache and handcrafted chocolate curls.',
      images: [{ url: 'https://ik.imagekit.io/by3es5jcax/products/images__1__L8mXhdC3w.jpg', fileId: '6a659c115c7cd75eb80949cd' }],
      isFeatured: true,
      seoTitle: 'Belgian Chocolate Truffle Cake | Velvet Crumb Bakery',
      metaDescription: 'Order 100% eggless Belgian Dark Chocolate Truffle Cake online in Demo City. Rich 70% cocoa ganache with fast 5km delivery.',
      variants: [
        { label: '500g', price: 550, stockQuantity: 15 },
        { label: '1kg', price: 950, stockQuantity: 10 },
        { label: '2kg', price: 1800, stockQuantity: 5 },
      ],
    },
    {
      name: 'Golden Butterscotch Crunch Cake',
      slug: 'butterscotch-chocolate',
      categorySlug: 'birthday-cakes',
      flavorName: 'Butterscotch Crunch',
      description: 'Light vanilla sponge layered with house-made butterscotch caramel cream and generously loaded with crunchy caramelized praline nuts. 100% pure eggless delight.',
      images: [{ url: 'https://ik.imagekit.io/by3es5jcax/products/Butterscotch-cake_Y0OR7GAIn.jpg', fileId: '6a6739c55c7cd75eb8322f51' }],
      isFeatured: true,
      seoTitle: 'Golden Butterscotch Crunch Cake | Velvet Crumb Bakery',
      metaDescription: 'Fresh eggless Butterscotch Crunch Cake with caramel praline nuts. Order online for same-day bakery delivery.',
      variants: [
        { label: '500g', price: 500, stockQuantity: 12 },
        { label: '1kg', price: 900, stockQuantity: 8 },
      ],
    },
    {
      name: 'Classic German Black Forest Cake',
      slug: 'black-forest',
      categorySlug: 'birthday-cakes',
      flavorName: 'Black Forest',
      description: 'Traditional German recipe featuring layers of dark chocolate sponge infused with sour cherry syrup, whipped vanilla cream, dark chocolate shavings, and maraschino cherries. 100% eggless.',
      images: [{ url: 'https://ik.imagekit.io/by3es5jcax/products/images__2__SrY-XeWzIA.jpg', fileId: '6a6739a65c7cd75eb830e976' }],
      isFeatured: true,
      seoTitle: 'Classic Black Forest Cake | Velvet Crumb Bakery',
      metaDescription: 'Authentic 100% eggless Black Forest Cake with cherries and whipped cream. Freshly baked daily in Demo City.',
      variants: [
        { label: '500g', price: 699, stockQuantity: 10 },
        { label: '1kg', price: 1299, stockQuantity: 6 },
      ],
    },
    {
      name: 'Creamy Pineapple Fresh Cream Cake',
      slug: 'creamy-pineapple-fresh-cream-cake',
      categorySlug: 'birthday-cakes',
      flavorName: 'Pineapple Fresh Cream',
      description: 'Tropical perfection with soft white sponge infused with natural pineapple juice, folded with light whipped cream and chunks of juicy farm-fresh pineapples. 100% pure vegetarian.',
      images: [],
      isFeatured: false,
      seoTitle: 'Fresh Cream Pineapple Cake | Velvet Crumb Bakery',
      metaDescription: 'Juicy pineapple chunks folded in fresh eggless cream cake. Order fresh pineapple birthday cake online.',
      variants: [
        { label: '500g', price: 525, stockQuantity: 14 },
        { label: '1kg', price: 950, stockQuantity: 9 },
      ],
    },
    {
      name: 'Alphonsa Mango Delice Birthday Cake',
      slug: 'alphonsa-mango-delice-birthday-cake',
      categorySlug: 'birthday-cakes',
      flavorName: 'Mango Delight',
      description: 'Real Ratnagiri Alphonsa mango puree layered with vanilla sponge and fluffy mango cream. Topped with fresh mango glazes and edible gold flakes. 100% eggless.',
      images: [],
      isFeatured: false,
      seoTitle: 'Alphonsa Mango Delice Cake | Velvet Crumb Bakery',
      metaDescription: 'Pure Ratnagiri Alphonsa mango cake with fresh whipped cream. 100% eggless bakery delivery.',
      variants: [
        { label: '500g', price: 575, stockQuantity: 10 },
        { label: '1kg', price: 1050, stockQuantity: 7 },
      ],
    },
    {
      name: 'Belgian Hazelnut Praline Cake',
      slug: 'belgian-hazelnut-praline-cake',
      categorySlug: 'birthday-cakes',
      flavorName: 'Hazelnut Praline',
      description: 'Decadent chocolate hazelnut sponge filled with smooth roasted hazelnut gianduja cream and crushed caramel pralines. Covered in dark chocolate drip.',
      images: [],
      isFeatured: false,
      seoTitle: 'Belgian Hazelnut Praline Cake | Velvet Crumb Bakery',
      metaDescription: 'Rich eggless roasted hazelnut praline cake with Belgian chocolate ganache.',
      variants: [
        { label: '500g', price: 675, stockQuantity: 8 },
        { label: '1kg', price: 1250, stockQuantity: 5 },
      ],
    },
    {
      name: 'Heavenly Vanilla Bean Berry Cake',
      slug: 'heavenly-vanilla-bean-berry-cake',
      categorySlug: 'birthday-cakes',
      flavorName: 'Vanilla Bean',
      description: 'Madagascar vanilla bean sponge infused with wild berry compote, whipped white chocolate chantilly cream, and topped with fresh seasonal berries. 100% eggless.',
      images: [],
      isFeatured: false,
      seoTitle: 'Vanilla Bean Berry Cake | Velvet Crumb Bakery',
      metaDescription: 'Eggless Madagascar vanilla bean cake layered with wild berry compote.',
      variants: [
        { label: '500g', price: 499, stockQuantity: 15 },
        { label: '1kg', price: 899, stockQuantity: 10 },
      ],
    },

    // ANNIVERSARY CAKES (5 products)
    {
      name: 'Royal Red Velvet Heart Cake',
      slug: 'royal-red-velvet-heart-cake',
      categorySlug: 'anniversary-cakes',
      flavorName: 'Red Velvet',
      description: 'A romantic heart-shaped creation of rich crimson red velvet sponge layered with silky authentic cream cheese frosting and fine velvet crumbs. 100% pure vegetarian.',
      images: [{ url: 'https://ik.imagekit.io/by3es5jcax/products/Red_Velvet_4vXXl4F_P7.jpg', fileId: '6a6739675c7cd75eb82e2f4d' }],
      isFeatured: true,
      seoTitle: 'Royal Red Velvet Heart Cake | Velvet Crumb Bakery',
      metaDescription: 'Heart-shaped eggless Red Velvet Cake with cream cheese frosting. Ideal anniversary cake delivery.',
      variants: [
        { label: '500g', price: 650, stockQuantity: 11 },
        { label: '1kg', price: 1150, stockQuantity: 8 },
      ],
    },
    {
      name: 'Chocolate Fondant Rose Heart Cake',
      slug: 'chocolate-fondant-rose-heart-cake',
      categorySlug: 'anniversary-cakes',
      flavorName: 'Chocolate Truffle',
      description: 'Heart-shaped dark Belgian chocolate sponge filled with molten chocolate fudge, surrounded by hand-piped edible chocolate roses and satin ribbon trim.',
      images: [],
      isFeatured: false,
      seoTitle: 'Chocolate Fondant Rose Heart Cake | Velvet Crumb Bakery',
      metaDescription: 'Handcrafted eggless chocolate fondant rose heart anniversary cake.',
      variants: [
        { label: '500g', price: 699, stockQuantity: 9 },
        { label: '1kg', price: 1299, stockQuantity: 6 },
      ],
    },
    {
      name: 'Strawberries & Cream Heart Delice',
      slug: 'strawberries-and-cream-heart-delice',
      categorySlug: 'anniversary-cakes',
      flavorName: 'Vanilla Bean',
      description: 'Delicate heart-shaped sponge soaked in sweet strawberry compote, whipped strawberry chantilly, and topped with fresh glazed strawberries. 100% eggless.',
      images: [],
      isFeatured: false,
      seoTitle: 'Strawberries & Cream Heart Delice | Velvet Crumb Bakery',
      metaDescription: 'Fresh eggless strawberry heart delice cake for romantic anniversary celebrations.',
      variants: [
        { label: '500g', price: 625, stockQuantity: 12 },
        { label: '1kg', price: 1100, stockQuantity: 7 },
      ],
    },
    {
      name: 'Double Chocolate Truffle Romance Cake',
      slug: 'double-chocolate-truffle-romance-cake',
      categorySlug: 'anniversary-cakes',
      flavorName: 'Chocolate Truffle',
      description: 'Silky milk and dark chocolate ganache double-layered inside a heart-contoured cocoa sponge, finished with a mirror glaze finish and golden hearts.',
      images: [],
      isFeatured: false,
      seoTitle: 'Double Chocolate Truffle Romance Cake | Velvet Crumb Bakery',
      metaDescription: 'Double chocolate ganache heart cake for wedding and anniversary celebrations.',
      variants: [
        { label: '500g', price: 675, stockQuantity: 10 },
        { label: '1kg', price: 1200, stockQuantity: 6 },
      ],
    },
    {
      name: 'Salted Caramel Drip Anniversary Cake',
      slug: 'salted-caramel-drip-anniversary-cake',
      categorySlug: 'anniversary-cakes',
      flavorName: 'Salted Caramel',
      description: 'Rich vanilla bean sponge layered with artisanal salted caramel butter cream, drizzled with gooey caramel drip and toasted macadamia nuts.',
      images: [],
      isFeatured: false,
      seoTitle: 'Salted Caramel Drip Anniversary Cake | Velvet Crumb Bakery',
      metaDescription: 'Artisanal salted caramel drip cake crafted with vanilla bean sponge.',
      variants: [
        { label: '500g', price: 725, stockQuantity: 7 },
        { label: '1kg', price: 1350, stockQuantity: 4 },
      ],
    },

    // OCCASION CAKES (4 products)
    {
      name: 'Ferrero Rocher Golden Fudge Cake',
      slug: 'ferrero-rocher-golden-fudge-cake',
      categorySlug: 'occasion-cakes',
      flavorName: 'Chocolate Truffle',
      description: 'Opulent celebration cake layered with Nutella hazelnut cream, crispy wafer bits, dark chocolate fudge, and crowned with whole Ferrero Rocher chocolates.',
      images: [],
      isFeatured: true,
      seoTitle: 'Ferrero Rocher Golden Fudge Cake | Velvet Crumb Bakery',
      metaDescription: 'Luxury eggless Ferrero Rocher cake with Nutella cream and hazelnut praline.',
      variants: [
        { label: '500g', price: 799, stockQuantity: 8 },
        { label: '1kg', price: 1499, stockQuantity: 5 },
      ],
    },
    {
      name: 'Opera Coffee & Dark Chocolate Cake',
      slug: 'opera-coffee-dark-chocolate-cake',
      categorySlug: 'occasion-cakes',
      flavorName: 'Coffee Opera',
      description: 'Classic French Opera cake adaptation featuring almond sponge soaked in espresso syrup, layered with dark chocolate ganache and coffee buttercream.',
      images: [],
      isFeatured: false,
      seoTitle: 'French Opera Coffee Cake | Velvet Crumb Bakery',
      metaDescription: 'Sophisticated eggless French Opera coffee and dark chocolate cake.',
      variants: [
        { label: '500g', price: 749, stockQuantity: 6 },
        { label: '1kg', price: 1399, stockQuantity: 4 },
      ],
    },
    {
      name: 'Wild Blueberry Baked Cheesecake',
      slug: 'wild-blueberry-baked-cheesecake',
      categorySlug: 'occasion-cakes',
      flavorName: 'Wild Blueberry',
      description: 'New York style eggless cheesecake with a crunchy Graham cracker crust, velvety cream cheese center, and topped with rich wild blueberry glaze.',
      images: [],
      isFeatured: false,
      seoTitle: 'Wild Blueberry Baked Cheesecake | Velvet Crumb Bakery',
      metaDescription: 'New York style eggless baked blueberry cheesecake order online.',
      variants: [
        { label: '500g', price: 799, stockQuantity: 9 },
        { label: '1kg', price: 1450, stockQuantity: 5 },
      ],
    },
    {
      name: 'Lotus Biscoff Caramel Mousse Cake',
      slug: 'lotus-biscoff-caramel-mousse-cake',
      categorySlug: 'occasion-cakes',
      flavorName: 'Lotus Biscoff',
      description: 'Trending gourmet cake featuring spiced Lotus Biscoff cookie crumble base, smooth Biscoff speculoos mousse, and melted biscoff drip.',
      images: [],
      isFeatured: false,
      seoTitle: 'Lotus Biscoff Caramel Mousse Cake | Velvet Crumb Bakery',
      metaDescription: 'Gourmet Lotus Biscoff cookie speculoos mousse cake. 100% pure eggless.',
      variants: [
        { label: '500g', price: 775, stockQuantity: 10 },
        { label: '1kg', price: 1425, stockQuantity: 6 },
      ],
    },

    // DESIGNER CAKES (4 products)
    {
      name: 'Elegant Floral Fondant Tier Cake',
      slug: 'elegant-floral-fondant-tier-cake',
      categorySlug: 'designer-cakes',
      flavorName: 'Vanilla Bean',
      description: 'Bespoke 2-tier designer celebration cake wrapped in smooth white fondant, adorned with handcrafted edible sugar roses and delicate gold leaf piping.',
      images: [],
      isFeatured: true,
      seoTitle: 'Elegant Floral Fondant Tier Cake | Velvet Crumb Bakery',
      metaDescription: 'Custom 2-tier designer floral fondant cake for grand celebrations.',
      variants: [
        { label: '1kg', price: 1899, stockQuantity: 5 },
        { label: '2kg', price: 3499, stockQuantity: 3 },
      ],
    },
    {
      name: 'Golden Macaron & Chocolate Drip Cake',
      slug: 'golden-macaron-chocolate-drip-cake',
      categorySlug: 'designer-cakes',
      flavorName: 'Chocolate Truffle',
      description: 'Tall contemporary drip cake decorated with Belgian chocolate ganache drip, French macarons, golden meringues, and chocolate sails.',
      images: [],
      isFeatured: false,
      seoTitle: 'Golden Macaron & Chocolate Drip Cake | Velvet Crumb Bakery',
      metaDescription: 'Modern designer chocolate drip cake decorated with macarons and golden meringue.',
      variants: [
        { label: '1kg', price: 1699, stockQuantity: 6 },
        { label: '2kg', price: 3199, stockQuantity: 3 },
      ],
    },
    {
      name: 'Celestial Galaxy Marble Cake',
      slug: 'celestial-galaxy-marble-cake',
      categorySlug: 'designer-cakes',
      flavorName: 'Chocolate Truffle',
      description: 'Artisan mirror glaze cake painted with deep space galaxy blues, purples, and silver stardust shimmer over a velvety dark chocolate truffle core.',
      images: [],
      isFeatured: false,
      seoTitle: 'Celestial Galaxy Mirror Glaze Cake | Velvet Crumb Bakery',
      metaDescription: 'Handcrafted mirror glaze celestial galaxy designer cake.',
      variants: [
        { label: '1kg', price: 1599, stockQuantity: 4 },
        { label: '2kg', price: 2999, stockQuantity: 2 },
      ],
    },
    {
      name: 'Pistachio & Rose Water Saffron Cake',
      slug: 'pistachio-rose-water-saffron-cake',
      categorySlug: 'designer-cakes',
      flavorName: 'Pistachio Rose',
      description: 'Royal fusion cake made with Kashmiri saffron-infused sponge, organic rose water cream, chopped Iranian pistachios, and dried rose petals.',
      images: [],
      isFeatured: false,
      seoTitle: 'Royal Pistachio Rose Saffron Cake | Velvet Crumb Bakery',
      metaDescription: 'Exotic Kashmiri saffron and pistachio rose designer fusion cake.',
      variants: [
        { label: '1kg', price: 1799, stockQuantity: 5 },
        { label: '2kg', price: 3399, stockQuantity: 3 },
      ],
    },

    // BOUQUETS & FLOWERS (3 products)
    {
      name: 'Royal Velvet Red Rose Bouquet',
      slug: 'bouquet',
      categorySlug: 'bouquets-flowers',
      flavorName: null,
      description: 'Hand-crafted floral arrangement of long-stem red roses wrapped in eco-friendly kraft paper and tied with a satin ribbon.',
      images: [{ url: 'https://ik.imagekit.io/by3es5jcax/products/764da5c14a8dc7f13ece2dfd6321e15d_68cgatczR.jpg', fileId: '6a6739805c7cd75eb82f58e8' }],
      isFeatured: true,
      seoTitle: 'Royal Red Rose Bouquet | Velvet Crumb Bakery',
      metaDescription: 'Fresh long-stem red roses hand bouquet. Same day delivery in Demo City.',
      variants: [
        { label: '12 Stems', price: 499, stockQuantity: 15 },
        { label: '20 Stems', price: 799, stockQuantity: 10 },
      ],
    },
    {
      name: 'Sunshine Yellow Roses & Lilies Bunch',
      slug: 'sunshine-yellow-roses-lilies-bunch',
      categorySlug: 'bouquets-flowers',
      flavorName: null,
      description: 'Bright and cheerful bunch of fresh yellow Dutch roses and fragrant white Asiatic lilies wrapped in sunny yellow tissue.',
      images: [],
      isFeatured: false,
      seoTitle: 'Sunshine Yellow Roses & Lilies | Velvet Crumb Bakery',
      metaDescription: 'Fresh yellow roses and white Asiatic lilies floral bouquet.',
      variants: [
        { label: '10 Stems', price: 549, stockQuantity: 12 },
        { label: '20 Stems', price: 899, stockQuantity: 8 },
      ],
    },
    {
      name: 'Elegance Pastels Mixed Flower Basket',
      slug: 'elegance-pastels-mixed-flower-basket',
      categorySlug: 'bouquets-flowers',
      flavorName: null,
      description: 'Artisanal willow basket filled with soft pastel carnations, peach roses, white baby\'s breath (gypsophila), and fresh eucalyptus leaves.',
      images: [],
      isFeatured: false,
      seoTitle: 'Pastel Mixed Flower Basket | Velvet Crumb Bakery',
      metaDescription: 'Artisanal willow flower basket with pastel carnations and peach roses.',
      variants: [
        { label: 'Standard Basket', price: 799, stockQuantity: 8 },
        { label: 'Deluxe Basket', price: 1299, stockQuantity: 5 },
      ],
    },

    // GIFTS & HAMPERS (2 products)
    {
      name: 'Luxury Belgian Truffles & Candle Gift Box',
      slug: 'luxury-belgian-truffles-candle-gift-box',
      categorySlug: 'gifts-hampers',
      flavorName: null,
      description: 'Premium gift box containing 16 handcrafted Belgian chocolate truffles paired with an scented soy wax candle.',
      images: [],
      isFeatured: true,
      seoTitle: 'Luxury Belgian Truffles & Candle Gift Box | Velvet Crumb Bakery',
      metaDescription: 'Handcrafted Belgian truffles and scented soy candle luxury gift box.',
      variants: [
        { label: 'Standard Box', price: 899, stockQuantity: 10 },
        { label: 'Deluxe Box', price: 1499, stockQuantity: 6 },
      ],
    },
    {
      name: 'Grand Celebration Gourmet Gift Hamper',
      slug: 'grand-celebration-gourmet-gift-hamper',
      categorySlug: 'gifts-hampers',
      flavorName: null,
      description: 'Ultimate gourmet celebration basket filled with double chocolate brownies, butter shortbread cookies, artisanal tea blends, and chocolate bars.',
      images: [],
      isFeatured: false,
      seoTitle: 'Grand Celebration Gourmet Hamper | Velvet Crumb Bakery',
      metaDescription: 'Exquisite gourmet gift basket filled with artisanal brownies, cookies and teas.',
      variants: [
        { label: 'Grand Hamper', price: 1899, stockQuantity: 6 },
        { label: 'Executive Hamper', price: 2999, stockQuantity: 4 },
      ],
    },
  ];

  let addedCount = 0;
  let updatedCount = 0;

  for (const item of catalog) {
    const categoryId = subcategoryMap.get(item.categorySlug);
    if (!categoryId) {
      throw new Error(`Category slug not found: ${item.categorySlug}`);
    }

    const flavorId = item.flavorName ? flavorMap.get(item.flavorName) || null : null;

    const existing = await prisma.product.findFirst({ where: { slug: item.slug } });

    if (existing) {
      // Delete old variants to re-insert clean ones
      await prisma.variant.deleteMany({ where: { productId: existing.id } });

      await prisma.product.update({
        where: { id: existing.id },
        data: {
          name: item.name,
          categoryId,
          flavorId,
          description: item.description,
          images: item.images,
          isActive: true,
          isDeleted: false,
          isFeatured: item.isFeatured,
          seoTitle: item.seoTitle,
          metaDescription: item.metaDescription,
          variants: {
            create: item.variants,
          },
        },
      });
      updatedCount++;
      console.log(`✏️ Updated product: ${item.name} (${item.slug})`);
    } else {
      await prisma.product.create({
        data: {
          name: item.name,
          slug: item.slug,
          categoryId,
          flavorId,
          description: item.description,
          images: item.images,
          isActive: true,
          isDeleted: false,
          isFeatured: item.isFeatured,
          seoTitle: item.seoTitle,
          metaDescription: item.metaDescription,
          variants: {
            create: item.variants,
          },
        },
      });
      addedCount++;
      console.log(`✨ Added new product: ${item.name} (${item.slug})`);
    }
  }

  const totalProducts = await prisma.product.count({ where: { isDeleted: false, isActive: true } });

  console.log('\n================ SUMMARY ================');
  console.log(`Updated Existing Products: ${updatedCount}`);
  console.log(`Added New Products: ${addedCount}`);
  console.log(`Total Active Products in Database: ${totalProducts}`);
  console.log('=========================================\n');

  await prisma.$disconnect();
}

run().catch((err) => {
  console.error('❌ Error executing database script:', err);
  process.exit(1);
});
