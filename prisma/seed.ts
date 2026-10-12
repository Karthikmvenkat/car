import { PrismaClient } from '@prisma/client';
import * as bcrypt from 'bcrypt';

const prisma = new PrismaClient();

async function main() {
  console.log('Seeding CAR database...\n');

  // ─── Create Admin User ───────────────────────────────────────
  const passwordHash = await bcrypt.hash('admin123', 12);
  const admin = await prisma.user.upsert({
    where: { email: 'admin@trycar.com' },
    update: {},
    create: {
      name: 'CAR Admin',
      email: 'admin@trycar.com',
      passwordHash,
      role: 'SUPER_ADMIN',
      status: 'ACTIVE',
      emailVerified: true,
    },
  });
  console.log(`Created admin user: ${admin.email}`);

  // ─── Create Demo Customer ────────────────────────────────────
  const customerHash = await bcrypt.hash('customer123', 12);
  const customer = await prisma.user.upsert({
    where: { email: 'demo@trycar.com' },
    update: {},
    create: {
      name: 'Demo Customer',
      email: 'demo@trycar.com',
      phone: '+15551234567',
      passwordHash: customerHash,
      role: 'CUSTOMER',
      status: 'ACTIVE',
      emailVerified: true,
    },
  });
  console.log(`Created demo customer: ${customer.email}`);

  // ─── Create Location ─────────────────────────────────────────
  const location = await prisma.location.create({
    data: {
      name: 'CAR Manhattan Showroom',
      address: '450 Park Avenue',
      city: 'New York',
      state: 'NY',
      country: 'US',
      phone: '+12125551234',
      email: 'showroom@trycar.com',
      timezone: 'America/New_York',
      active: true,
    },
  });
  console.log(`Created location: ${location.name}`);

  // ─── Create Brands ───────────────────────────────────────────
  const brands = [
    { name: 'BMW', slug: 'bmw', logoUrl: 'https://img.logo.dev/bmw.com?token=pk_anonymous&size=200' },
    { name: 'Mercedes-Benz', slug: 'mercedes-benz', logoUrl: 'https://img.logo.dev/mercedes-benz.com?token=pk_anonymous&size=200' },
    { name: 'Audi', slug: 'audi', logoUrl: 'https://img.logo.dev/audi.com?token=pk_anonymous&size=200' },
    { name: 'Porsche', slug: 'porsche', logoUrl: 'https://img.logo.dev/porsche.com?token=pk_anonymous&size=200' },
    { name: 'Tesla', slug: 'tesla', logoUrl: 'https://img.logo.dev/tesla.com?token=pk_anonymous&size=200' },
    { name: 'Lexus', slug: 'lexus', logoUrl: 'https://img.logo.dev/lexus.com?token=pk_anonymous&size=200' },
    { name: 'Range Rover', slug: 'range-rover', logoUrl: 'https://img.logo.dev/landrover.com?token=pk_anonymous&size=200' },
    { name: 'Toyota', slug: 'toyota', logoUrl: 'https://img.logo.dev/toyota.com?token=pk_anonymous&size=200' },
  ];

  for (const b of brands) {
    await prisma.brand.upsert({
      where: { slug: b.slug },
      update: {},
      create: b,
    });
  }
  console.log(`Created ${brands.length} brands`);

  // ─── Create Models ───────────────────────────────────────────
  const modelsData: { brandSlug: string; name: string; slug: string; bodyStyle: string }[] = [
    { brandSlug: 'bmw', name: 'M4 Competition', slug: 'm4-competition', bodyStyle: 'Coupe' },
    { brandSlug: 'bmw', name: 'X5 xDrive40i', slug: 'x5-xdrive40i', bodyStyle: 'SUV' },
    { brandSlug: 'bmw', name: '3 Series 330i', slug: '3-series-330i', bodyStyle: 'Sedan' },
    { brandSlug: 'mercedes-benz', name: 'AMG GT 63', slug: 'amg-gt-63', bodyStyle: 'Sedan' },
    { brandSlug: 'mercedes-benz', name: 'GLE 450', slug: 'gle-450', bodyStyle: 'SUV' },
    { brandSlug: 'audi', name: 'RS e-tron GT', slug: 'rs-e-tron-gt', bodyStyle: 'Sedan' },
    { brandSlug: 'audi', name: 'Q8 55', slug: 'q8-55', bodyStyle: 'SUV' },
    { brandSlug: 'porsche', name: '911 Carrera S', slug: '911-carrera-s', bodyStyle: 'Coupe' },
    { brandSlug: 'porsche', name: 'Cayenne S', slug: 'cayenne-s', bodyStyle: 'SUV' },
    { brandSlug: 'tesla', name: 'Model S Plaid', slug: 'model-s-plaid', bodyStyle: 'Sedan' },
    { brandSlug: 'tesla', name: 'Model X', slug: 'model-x', bodyStyle: 'SUV' },
    { brandSlug: 'lexus', name: 'LC 500', slug: 'lc-500', bodyStyle: 'Coupe' },
    { brandSlug: 'lexus', name: 'RX 500h', slug: 'rx-500h', bodyStyle: 'SUV' },
    { brandSlug: 'range-rover', name: 'Sport P530', slug: 'sport-p530', bodyStyle: 'SUV' },
    { brandSlug: 'toyota', name: 'GR Supra 3.0', slug: 'gr-supra-3-0', bodyStyle: 'Coupe' },
  ];

  for (const m of modelsData) {
    const brand = await prisma.brand.findUnique({ where: { slug: m.brandSlug } });
    if (brand) {
      await prisma.model.upsert({
        where: { brandId_slug: { brandId: brand.id, slug: m.slug } },
        update: {},
        create: {
          name: m.name,
          slug: m.slug,
          bodyStyle: m.bodyStyle,
          brandId: brand.id,
        },
      });
    }
  }
  console.log(`Created ${modelsData.length} models`);

  // ─── Create Vehicles ─────────────────────────────────────────
  const vehiclesData = [
    {
      brandSlug: 'bmw', modelSlug: 'm4-competition', variant: 'Competition xDrive',
      year: 2024, condition: 'NEW' as const, price: 84900, mileage: 12,
      fuelType: 'Gasoline', transmission: 'Automatic', drivetrain: 'AWD',
      bodyStyle: 'Coupe', exteriorColor: 'Isle of Man Green', interiorColor: 'Black Merino Leather',
      description: 'A stunning BMW M4 Competition finished in the exclusive Isle of Man Green. This example is equipped with the xDrive all-wheel-drive system, Carbon Fiber package, and M Driver\'s Package.',
      status: 'AVAILABLE' as const, featured: true,
      images: [
        { url: 'https://images.unsplash.com/photo-1617814076367-b759c7d7e738?w=1200&q=80', alt: 'BMW M4 Competition front view', isPrimary: true },
        { url: 'https://images.unsplash.com/photo-1555215695-3004980ad54e?w=1200&q=80', alt: 'BMW M4 Competition side view' },
      ],
    },
    {
      brandSlug: 'porsche', modelSlug: '911-carrera-s', variant: 'Carrera S',
      year: 2024, condition: 'NEW' as const, price: 134900, mileage: 45,
      fuelType: 'Gasoline', transmission: 'Automatic', drivetrain: 'RWD',
      bodyStyle: 'Coupe', exteriorColor: 'GT Silver Metallic', interiorColor: 'Bordeaux Red',
      description: 'An iconic Porsche 911 Carrera S in GT Silver. Features include the Sport Chrono Package, PASM sport suspension, and Burmester sound system.',
      status: 'AVAILABLE' as const, featured: true,
      images: [
        { url: 'https://images.unsplash.com/photo-1614162692292-7ac56d7f7f1e?w=1200&q=80', alt: 'Porsche 911 Carrera S', isPrimary: true },
      ],
    },
    {
      brandSlug: 'mercedes-benz', modelSlug: 'amg-gt-63', variant: 'AMG GT 63 S',
      year: 2023, condition: 'CERTIFIED' as const, price: 159900, mileage: 8200,
      fuelType: 'Gasoline', transmission: 'Automatic', drivetrain: 'AWD',
      bodyStyle: 'Sedan', exteriorColor: 'Obsidian Black', interiorColor: 'Nappa Leather Exclusive',
      description: 'A barely-driven Mercedes-AMG GT 63 S with the 4.0L V8 Biturbo producing 630hp. Full AMG Performance exhaust, carbon fiber trim, and MBUX augmented navigation.',
      status: 'AVAILABLE' as const, featured: true,
      images: [
        { url: 'https://images.unsplash.com/photo-1618843479313-40f8afb4b4d8?w=1200&q=80', alt: 'Mercedes-AMG GT 63', isPrimary: true },
      ],
    },
    {
      brandSlug: 'tesla', modelSlug: 'model-s-plaid', variant: 'Plaid',
      year: 2024, condition: 'NEW' as const, price: 108990, mileage: 28,
      fuelType: 'Electric', transmission: 'Automatic', drivetrain: 'AWD',
      bodyStyle: 'Sedan', exteriorColor: 'Pearl White', interiorColor: 'All White',
      description: 'The quickest production car ever made. Tesla Model S Plaid with 1,020 horsepower, 0-60 in under 2 seconds, and 396 miles of range.',
      status: 'AVAILABLE' as const, featured: true,
      images: [
        { url: 'https://images.unsplash.com/photo-1560958089-b8a1929cea89?w=1200&q=80', alt: 'Tesla Model S Plaid', isPrimary: true },
      ],
    },
    {
      brandSlug: 'audi', modelSlug: 'rs-e-tron-gt', variant: 'RS',
      year: 2023, condition: 'USED' as const, price: 119500, mileage: 12400,
      fuelType: 'Electric', transmission: 'Automatic', drivetrain: 'AWD',
      bodyStyle: 'Sedan', exteriorColor: 'Daytona Grey', interiorColor: 'Black Valcona Leather',
      description: 'Audi RS e-tron GT — grand touring meets zero emissions. 637hp, 800-volt architecture for ultra-fast charging, and a stunning design.',
      status: 'AVAILABLE' as const, featured: false,
      images: [
        { url: 'https://images.unsplash.com/photo-1606664515524-ed2f786a0bd6?w=1200&q=80', alt: 'Audi RS e-tron GT', isPrimary: true },
      ],
    },
    {
      brandSlug: 'lexus', modelSlug: 'lc-500', variant: '500 V8',
      year: 2024, condition: 'NEW' as const, price: 98500, mileage: 156,
      fuelType: 'Gasoline', transmission: 'Automatic', drivetrain: 'RWD',
      bodyStyle: 'Coupe', exteriorColor: 'Infrared', interiorColor: 'Circuit Red',
      description: 'The Lexus LC 500 is a stunning grand tourer with a naturally aspirated 5.0L V8 and 10-speed automatic. Infrared over Circuit Red is a show-stopping combination.',
      status: 'AVAILABLE' as const, featured: false,
      images: [
        { url: 'https://images.unsplash.com/photo-1621993202323-f438eec934ff?w=1200&q=80', alt: 'Lexus LC 500', isPrimary: true },
      ],
    },
  ];

  for (const v of vehiclesData) {
    const brand = await prisma.brand.findUnique({ where: { slug: v.brandSlug } });
    const model = await prisma.model.findFirst({ where: { slug: v.modelSlug, brandId: brand!.id } });

    if (!brand || !model) {
      console.warn(`Skipping vehicle: ${v.brandSlug} ${v.modelSlug} - brand/model not found`);
      continue;
    }

    const slug = `${v.year}-${v.brandSlug}-${v.modelSlug}`.replace(/\s+/g, '-');

    await prisma.vehicle.upsert({
      where: { slug },
      update: {},
      create: {
        slug,
        year: v.year,
        variant: v.variant,
        condition: v.condition,
        price: v.price,
        mileage: v.mileage,
        fuelType: v.fuelType,
        transmission: v.transmission,
        drivetrain: v.drivetrain,
        bodyStyle: v.bodyStyle,
        exteriorColor: v.exteriorColor,
        interiorColor: v.interiorColor,
        description: v.description,
        status: v.status,
        featured: v.featured,
        publishedAt: v.status === 'AVAILABLE' ? new Date() : null,
        brandId: brand.id,
        modelId: model.id,
        locationId: location.id,
        images: {
          create: v.images.map((img, i) => ({
            url: img.url,
            alt: img.alt || '',
            order: i,
            isPrimary: img.isPrimary || false,
          })),
        },
      },
    });
  }
  console.log(`Created ${vehiclesData.length} vehicles`);

  // ─── Create Testimonials ─────────────────────────────────────
  const testimonials = [
    {
      name: 'Sarah Mitchell',
      role: 'San Francisco, CA',
      quote: 'CAR made buying my dream Porsche an absolute pleasure. The team was knowledgeable, transparent, and never pushy. I drove home feeling confident in every way.',
      rating: 5,
      active: true,
      order: 0,
    },
    {
      name: 'James Chen',
      role: 'Austin, TX',
      quote: 'I\'ve purchased many vehicles in my career, and CAR is genuinely the best experience I\'ve had. They found me a spec I didn\'t even know existed.',
      rating: 5,
      active: true,
      order: 1,
    },
    {
      name: 'Emily Rodriguez',
      role: 'Miami, FL',
      quote: 'From the first call to delivery, everything was seamless. The attention to detail and personal touches made all the difference. Highly recommend.',
      rating: 5,
      active: true,
      order: 2,
    },
  ];

  for (const t of testimonials) {
    await prisma.testimonial.create({ data: t });
  }
  console.log(`Created ${testimonials.length} testimonials`);

  // ─── Create FAQs ─────────────────────────────────────────────
  const faqs = [
    { question: 'How does the CAR buying process work?', answer: 'Browse our curated inventory, submit an enquiry or book a test drive, and our team will guide you through every step — from selection to delivery.', category: 'General', order: 0 },
    { question: 'Do you offer financing options?', answer: 'Yes, we work with multiple premium financing partners to offer competitive rates. Our team can help you find the right financing solution for your needs.', category: 'Financing', order: 1 },
    { question: 'Can I trade in my current vehicle?', answer: 'Absolutely. We offer competitive trade-in valuations and can handle the entire process for you. Request a trade-in appraisal through our website.', category: 'Trade-In', order: 2 },
    { question: 'Do you ship vehicles nationwide?', answer: 'Yes, we offer enclosed transport shipping to all 50 states. Shipping costs and timelines vary by destination — contact us for a quote.', category: 'Shipping', order: 3 },
    { question: 'What warranty coverage is included?', answer: 'All new vehicles come with the full manufacturer warranty. Certified pre-owned vehicles include an extended warranty package. Used vehicles may have remaining factory coverage.', category: 'General', order: 4 },
    { question: 'How do I schedule a test drive?', answer: 'You can book a test drive directly from any vehicle detail page, or contact our team to arrange a convenient time. We offer both showroom and off-site test drives.', category: 'General', order: 5 },
  ];

  for (const f of faqs) {
    await prisma.fAQ.create({ data: f });
  }
  console.log(`Created ${faqs.length} FAQs`);

  // ─── Create Page Content ─────────────────────────────────────
  await prisma.pageContent.create({
    data: {
      slug: 'home',
      title: 'CAR — Your Next Car, A Better Way',
      content: JSON.stringify({
        hero: {
          eyebrow: 'A Better Way to Buy',
          headline1: 'Your Next Car,',
          headline2: 'A Better Way.',
          supportingText: 'Premium vehicles, transparent pricing, and thoughtful guidance — curated for those who appreciate the journey.',
          ctaPrimary: { label: 'Discover Vehicles', href: '/vehicles' },
          ctaSecondary: { label: 'How It Works', href: '/how-it-works' },
        },
      }),
      active: true,
    },
  });
  console.log('Created homepage content');

  // ─── Create SEO Metadata ─────────────────────────────────────
  const seoPages = [
    { path: '/', title: 'CAR — Premium Automotive Marketplace', description: 'Discover premium vehicles with transparent pricing and a curated buying experience.' },
    { path: '/vehicles', title: 'Browse Vehicles — CAR', description: 'Explore our curated collection of premium vehicles.' },
    { path: '/how-it-works', title: 'How It Works — CAR', description: 'Learn about our streamlined car buying process.' },
    { path: '/about', title: 'About CAR', description: 'Discover why CAR is redefining the automotive buying experience.' },
    { path: '/contact', title: 'Contact Us — CAR', description: 'Get in touch with the CAR team.' },
  ];

  for (const s of seoPages) {
    await prisma.seoMetadata.create({ data: s });
  }
  console.log(`Created ${seoPages.length} SEO metadata entries`);

  console.log('\nSeeding complete!');
  console.log('\nDemo credentials:');
  console.log('  Admin:    admin@trycar.com / admin123');
  console.log('  Customer: demo@trycar.com / customer123');
}

main()
  .catch((e) => {
    console.error('Seed error:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
