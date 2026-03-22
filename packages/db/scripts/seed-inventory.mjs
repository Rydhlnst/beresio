#!/usr/bin/env node
/**
 * Seed script for Inventory Products and Stocks
 * Run: node scripts/seed-inventory.mjs [organization_id]
 */

import { drizzle } from "drizzle-orm/neon-http";
import { neon } from "@neondatabase/serverless";
import {
  inventoryProducts,
  inventoryStocks,
  branches,
} from "../src/schema/index.ts";

const DATABASE_URL = process.env.DATABASE_URL;

if (!DATABASE_URL) {
  console.error("❌ DATABASE_URL not found in environment");
  process.exit(1);
}

const sql = neon(DATABASE_URL);
const db = drizzle(sql);

// Sample Inventory Products
const inventoryProductsData = [
  { name: "Indomie Goreng Original", sku: "INV-IND-001", unit: "pcs", isActive: true },
  { name: "Indomie Soto Mie", sku: "INV-IND-002", unit: "pcs", isActive: true },
  { name: "Samsung Galaxy A54", sku: "INV-SAM-A54", unit: "pcs", isActive: true },
  { name: "Pepsi Cola 1.5L", sku: "INV-PEP-1500", unit: "botol", isActive: true },
  { name: "Aqua Botol 600ml", sku: "INV-AQUA-600", unit: "botol", isActive: true },
  { name: "Nescafe Classic 200g", sku: "INV-NES-200", unit: "pcs", isActive: true },
  { name: "Rinso Anti Noda 1.8kg", sku: "INV-RINSO-1800", unit: "pcs", isActive: true },
  { name: "Beng-Beng Chocolate", sku: "INV-BENG-001", unit: "pcs", isActive: true },
  { name: "Soffell Lotion 80ml", sku: "INV-SOF-080", unit: "pcs", isActive: true },
  { name: "Chitato Original 75g", sku: "INV-CHIT-075", unit: "pcs", isActive: true },
];

async function seed() {
  console.log("📦 Starting inventory seeding...\n");

  try {
    const orgId = process.argv[2] || "default_org_id";
    console.log(`Using organization ID: ${orgId}\n`);

    // 1. Get existing branches
    console.log("🏢 Fetching branches...");
    const existingBranches = await db
      .select({ id: branches.id, name: branches.name })
      .from(branches)
      .where({ organizationId: orgId, isActive: true })
      .limit(10);

    if (existingBranches.length === 0) {
      console.log("⚠️  No active branches found. Please create branches first.");
      console.log("   Run: pnpm db:seed:business\n");
      process.exit(1);
    }

    console.log(`   Found ${existingBranches.length} branches\n`);

    // 2. Seed Inventory Products
    console.log("📋 Seeding inventory products...");
    const createdProducts = [];
    
    for (const prod of inventoryProductsData) {
      const [existing] = await db
        .select()
        .from(inventoryProducts)
        .where({ sku: prod.sku, organizationId: orgId });
      
      if (existing) {
        console.log(`  ⚠️  Inventory product "${prod.name}" already exists`);
        createdProducts.push(existing);
      } else {
        const [created] = await db
          .insert(inventoryProducts)
          .values({ ...prod, organizationId: orgId })
          .returning();
        createdProducts.push(created);
        console.log(`  ✅ Created inventory product: ${prod.name}`);
      }
    }

    // 3. Seed Stocks for each product in each branch
    console.log("\n📊 Seeding stock quantities...");
    let stockCount = 0;

    for (const product of createdProducts) {
      for (const branch of existingBranches) {
        // Check if stock exists
        const [existingStock] = await db
          .select()
          .from(inventoryStocks)
          .where({
            productId: product.id,
            branchId: branch.id,
            organizationId: orgId,
          });

        if (!existingStock) {
          // Random stock between 0 and 200
          const quantity = Math.floor(Math.random() * 200);
          
          await db.insert(inventoryStocks).values({
            organizationId: orgId,
            productId: product.id,
            branchId: branch.id,
            quantity,
          });
          stockCount++;
        }
      }
    }

    console.log(`  ✅ Created ${stockCount} stock records\n`);

    // Summary
    console.log("✨ Inventory seeding completed!");
    console.log(`   Inventory Products: ${createdProducts.length}`);
    console.log(`   Branches: ${existingBranches.length}`);
    console.log(`   Stock Records: ${stockCount}`);
    console.log(`\n   Branches seeded:`);
    existingBranches.forEach(b => console.log(`     - ${b.name}`));

  } catch (error) {
    console.error("\n❌ Seeding failed:", error);
    process.exit(1);
  }

  process.exit(0);
}

seed();
