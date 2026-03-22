#!/usr/bin/env node
/**
 * Seed script for Products, Categories, and Suppliers
 * Run: node scripts/seed-products.mjs
 */

import { drizzle } from "drizzle-orm/neon-http";
import { neon } from "@neondatabase/serverless";
import {
  products,
  productCategories,
  suppliers,
  inventoryProducts,
} from "../src/schema/index.ts";

const DATABASE_URL = process.env.DATABASE_URL;

if (!DATABASE_URL) {
  console.error("❌ DATABASE_URL not found in environment");
  process.exit(1);
}

const sql = neon(DATABASE_URL);
const db = drizzle(sql);

// Sample Categories
const categoriesData = [
  { name: "Elektronik", slug: "elektronik", description: "Produk elektronik dan gadget" },
  { name: "Fashion", slug: "fashion", description: "Pakaian dan aksesoris" },
  { name: "Makanan & Minuman", slug: "makanan-minuman", description: "Produk konsumsi" },
  { name: "Kesehatan & Kecantikan", slug: "kesehatan-kecantikan", description: "Produk perawatan" },
  { name: "Rumah Tangga", slug: "rumah-tangga", description: "Peralatan rumah tangga" },
  { name: "Olahraga", slug: "olahraga", description: "Peralatan olahraga" },
  { name: "Buku & Alat Tulis", slug: "buku-alat-tulis", description: "Kebutuhan kantor dan sekolah" },
  { name: "Mainan & Hobi", slug: "mainan-hobi", description: "Mainan dan koleksi" },
];

// Sample Suppliers
const suppliersData = [
  { name: "PT Indofood", code: "INDO", contactName: "Budi Santoso", email: "budi@indofood.com", phone: "021-1234567" },
  { name: "PT Unilever Indonesia", code: "UNILEVER", contactName: "Siti Rahayu", email: "siti@unilever.com", phone: "021-2345678" },
  { name: "PT Samsung Electronics", code: "SAMSUNG", contactName: "Ahmad Wijaya", email: "ahmad@samsung.com", phone: "021-3456789" },
  { name: "PT Nestlé Indonesia", code: "NESTLE", contactName: "Dewi Kusuma", email: "dewi@nestle.com", phone: "021-4567890" },
  { name: "PT Mayora Indah", code: "MAYORA", contactName: "Eko Prasetyo", email: "eko@mayora.com", phone: "021-5678901" },
  { name: "PT Wings Surya", code: "WINGS", contactName: "Rina Susanti", email: "rina@wings.com", phone: "021-6789012" },
  { name: "PT Coca-Cola Indonesia", code: "COCACOLA", contactName: "Fajar Hidayat", email: "fajar@coca-cola.com", phone: "021-7890123" },
  { name: "PT Indocement", code: "INDOCEMENT", contactName: "Hendra Gunawan", email: "hendra@indocement.com", phone: "021-8901234" },
];

// Sample Products
const productsData = [
  {
    name: "Indomie Goreng Original",
    sku: "IND-001",
    barcode: "8998866200313",
    basePrice: 3500,
    salePrice: 3000,
    costPrice: 2800,
    weight: 85,
    description: "Mie instan goreng dengan bumbu spesial",
    shortDescription: "Mie goreng lezat dan praktis",
    categorySlug: "makanan-minuman",
    supplierCode: "INDO",
    imageUrl: "https://res.cloudinary.com/demo/image/upload/v1312461204/sample.jpg",
  },
  {
    name: "Samsung Galaxy A54 5G",
    sku: "SAM-A54-001",
    barcode: "8806094881234",
    basePrice: 5999000,
    salePrice: 5499000,
    costPrice: 4800000,
    weight: 202,
    description: "Smartphone 5G dengan kamera 50MP, layar Super AMOLED 120Hz",
    shortDescription: "Smartphone 5G terbaik di kelasnya",
    categorySlug: "elektronik",
    supplierCode: "SAMSUNG",
    imageUrl: "https://res.cloudinary.com/demo/image/upload/v1312461204/sample.jpg",
  },
  {
    name: "Pepsi Cola 1.5L",
    sku: "PEP-1500",
    barcode: "8998866200455",
    basePrice: 12000,
    salePrice: 10500,
    costPrice: 9000,
    weight: 1500,
    description: "Minuman soda cola segar",
    shortDescription: "Minuman bersoda rasa cola",
    categorySlug: "makanan-minuman",
    supplierCode: "COCACOLA",
    imageUrl: "https://res.cloudinary.com/demo/image/upload/v1312461204/sample.jpg",
  },
  {
    name: "Kaos Polos Cotton Combed 30S",
    sku: "KAOS-001",
    barcode: "8991234567890",
    basePrice: 85000,
    salePrice: 75000,
    costPrice: 55000,
    weight: 200,
    description: "Kaos polos bahan cotton combed 30S, nyaman dipakai",
    shortDescription: "Kaos polos premium",
    categorySlug: "fashion",
    supplierCode: null,
    imageUrl: "https://res.cloudinary.com/demo/image/upload/v1312461204/sample.jpg",
  },
  {
    name: "Nescafe Classic 200g",
    sku: "NES-200",
    barcode: "7891000100103",
    basePrice: 45000,
    salePrice: 42000,
    costPrice: 35000,
    weight: 200,
    description: "Kopi instan premium dengan aroma khas",
    shortDescription: "Kopi instant premium",
    categorySlug: "makanan-minuman",
    supplierCode: "NESTLE",
    imageUrl: "https://res.cloudinary.com/demo/image/upload/v1312461204/sample.jpg",
  },
  {
    name: "Rinso Anti Noda 1.8kg",
    sku: "RINSO-1800",
    barcode: "8999999521234",
    basePrice: 42000,
    salePrice: 38500,
    costPrice: 32000,
    weight: 1800,
    description: "Deterjen bubuk dengan formula anti noda",
    shortDescription: "Deterjen anti noda powerful",
    categorySlug: "rumah-tangga",
    supplierCode: "UNILEVER",
    imageUrl: "https://res.cloudinary.com/demo/image/upload/v1312461204/sample.jpg",
  },
  {
    name: "Beng-Beng Chocolate",
    sku: "BENG-001",
    barcode: "8998866200678",
    basePrice: 2500,
    salePrice: 2200,
    costPrice: 1800,
    weight: 25,
    description: "Wafer cokelat dengan krim cokelat lezat",
    shortDescription: "Wafer cokelat krim",
    categorySlug: "makanan-minuman",
    supplierCode: "MAYORA",
    imageUrl: "https://res.cloudinary.com/demo/image/upload/v1312461204/sample.jpg",
  },
  {
    name: "Soffell Lotion 80ml",
    sku: "SOF-080",
    barcode: "8998866200989",
    basePrice: 18000,
    salePrice: 16500,
    costPrice: 14000,
    weight: 80,
    description: "Lotion anti nyamuk dengan aroma segar",
    shortDescription: "Lotion anti nyamuk",
    categorySlug: "kesehatan-kecantikan",
    supplierCode: "WINGS",
    imageUrl: "https://res.cloudinary.com/demo/image/upload/v1312461204/sample.jpg",
  },
  {
    name: "Macbook Pro 14-inch M3",
    sku: "MAC-M3-14",
    barcode: "1942528001234",
    basePrice: 28999000,
    salePrice: 26999000,
    costPrice: 24500000,
    weight: 1600,
    description: "Laptop profesional dengan chip M3, layar Liquid Retina XDR",
    shortDescription: "Laptop profesional Apple",
    categorySlug: "elektronik",
    supplierCode: null,
    imageUrl: "https://res.cloudinary.com/demo/image/upload/v1312461204/sample.jpg",
  },
  {
    name: "Aqua Botol 600ml",
    sku: "AQUA-600",
    barcode: "8886008101123",
    basePrice: 4500,
    salePrice: 4000,
    costPrice: 3200,
    weight: 600,
    description: "Air mineral segar dari sumber alami",
    shortDescription: "Air mineral premium",
    categorySlug: "makanan-minuman",
    supplierCode: "NESTLE",
    imageUrl: "https://res.cloudinary.com/demo/image/upload/v1312461204/sample.jpg",
  },
];

async function seed() {
  console.log("🌱 Starting seeding...\n");

  try {
    // Get organization ID from user input or use default
    const orgId = process.argv[2] || "default_org_id";
    console.log(`Using organization ID: ${orgId}\n`);

    // 1. Seed Categories
    console.log("📁 Seeding categories...");
    const createdCategories = [];
    for (const cat of categoriesData) {
      const [existing] = await db
        .select()
        .from(productCategories)
        .where({ name: cat.name, organizationId: orgId });
      
      if (existing) {
        console.log(`  ⚠️  Category "${cat.name}" already exists`);
        createdCategories.push(existing);
      } else {
        const [created] = await db
          .insert(productCategories)
          .values({ ...cat, organizationId: orgId })
          .returning();
        createdCategories.push(created);
        console.log(`  ✅ Created category: ${cat.name}`);
      }
    }

    // 2. Seed Suppliers
    console.log("\n🏢 Seeding suppliers...");
    const createdSuppliers = [];
    for (const sup of suppliersData) {
      const [existing] = await db
        .select()
        .from(suppliers)
        .where({ code: sup.code, organizationId: orgId });
      
      if (existing) {
        console.log(`  ⚠️  Supplier "${sup.name}" already exists`);
        createdSuppliers.push(existing);
      } else {
        const [created] = await db
          .insert(suppliers)
          .values({ ...sup, organizationId: orgId, isActive: true })
          .returning();
        createdSuppliers.push(created);
        console.log(`  ✅ Created supplier: ${sup.name}`);
      }
    }

    // 3. Seed Products
    console.log("\n📦 Seeding products...");
    let successCount = 0;
    let skipCount = 0;

    for (const prod of productsData) {
      // Find category ID
      const category = createdCategories.find(c => c.slug === prod.categorySlug);
      const categoryId = category?.id || null;

      // Find supplier ID
      const supplier = createdSuppliers.find(s => s.code === prod.supplierCode);
      const supplierId = supplier?.id || null;

      // Check if product exists
      const [existing] = await db
        .select()
        .from(products)
        .where({ sku: prod.sku, organizationId: orgId });

      if (existing) {
        console.log(`  ⚠️  Product "${prod.name}" already exists`);
        skipCount++;
      } else {
        await db.insert(products).values({
          name: prod.name,
          sku: prod.sku,
          barcode: prod.barcode,
          organizationId: orgId,
          categoryId,
          supplierId,
          basePrice: prod.basePrice,
          salePrice: prod.salePrice,
          costPrice: prod.costPrice,
          weight: prod.weight,
          description: prod.description,
          shortDescription: prod.shortDescription,
          imageUrl: prod.imageUrl,
          isActive: true,
          isFeatured: Math.random() > 0.7, // 30% chance of being featured
          soldCount: Math.floor(Math.random() * 1000),
        });
        console.log(`  ✅ Created product: ${prod.name}`);
        successCount++;
      }
    }

    console.log("\n✨ Seeding completed!");
    console.log(`   Categories: ${createdCategories.length}`);
    console.log(`   Suppliers: ${createdSuppliers.length}`);
    console.log(`   Products: ${successCount} created, ${skipCount} skipped`);

  } catch (error) {
    console.error("\n❌ Seeding failed:", error);
    process.exit(1);
  }

  process.exit(0);
}

seed();
