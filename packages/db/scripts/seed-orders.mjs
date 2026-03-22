#!/usr/bin/env node
/**
 * Seed script for Orders and Customers
 * Run: node scripts/seed-orders.mjs [organization_id]
 */

import { drizzle } from "drizzle-orm/neon-http";
import { neon } from "@neondatabase/serverless";
import {
  orders,
  orderItems,
  customers,
  payments,
  branches,
  inventoryProducts,
} from "../src/schema/index.ts";

const DATABASE_URL = process.env.DATABASE_URL;

if (!DATABASE_URL) {
  console.error("❌ DATABASE_URL not found in environment");
  process.exit(1);
}

const sql = neon(DATABASE_URL);
const db = drizzle(sql);

// Sample Customer Names
const customerNames = [
  "Budi Santoso", "Siti Rahayu", "Ahmad Wijaya", "Dewi Kusuma",
  "Eko Prasetyo", "Rina Susanti", "Fajar Hidayat", "Hendra Gunawan",
  "Lina Marlina", "Yusuf Ibrahim", "Maya Sari", "Rudi Hartono",
  "Nina Amalia", "Dedi Kurniawan", "Ani Wulandari", "Bambang Sutrisno",
  "Citra Lestari", "Agus Salim", "Fitriani", "Hadi Sucipto",
];

// Sample Order Statuses
const orderStatuses = ["pending", "processing", "completed", "cancelled"];
const paymentStatuses = ["pending", "paid", "failed", "refunded"];
const paymentMethods = ["cash", "transfer", "credit_card", "e_wallet", "qris"];

function generateOrderNumber(index) {
  const date = new Date();
  const dateStr = date.toISOString().slice(0, 10).replace(/-/g, "");
  return `ORD-${dateStr}-${String(index + 1).padStart(4, "0")}`;
}

function randomDate(daysBack = 30) {
  const date = new Date();
  date.setDate(date.getDate() - Math.floor(Math.random() * daysBack));
  date.setHours(Math.floor(Math.random() * 24), Math.floor(Math.random() * 60));
  return date;
}

async function seed() {
  console.log("🛒 Starting orders seeding...\n");

  try {
    const orgId = process.argv[2] || "default_org_id";
    console.log(`Using organization ID: ${orgId}\n`);

    // 1. Get branches
    console.log("🏢 Fetching branches...");
    const existingBranches = await db
      .select({ id: branches.id, name: branches.name })
      .from(branches)
      .where({ organizationId: orgId, isActive: true })
      .limit(10);

    if (existingBranches.length === 0) {
      console.log("⚠️  No active branches found.");
      process.exit(1);
    }

    // 2. Get inventory products
    console.log("📦 Fetching inventory products...");
    const existingProducts = await db
      .select({ id: inventoryProducts.id, name: inventoryProducts.name })
      .from(inventoryProducts)
      .where({ organizationId: orgId, isActive: true })
      .limit(20);

    if (existingProducts.length === 0) {
      console.log("⚠️  No inventory products found. Run: pnpm db:seed:inventory\n");
      process.exit(1);
    }

    // 3. Create Customers
    console.log("👥 Creating customers...");
    const createdCustomers = [];
    
    for (const name of customerNames) {
      const email = `${name.toLowerCase().replace(/\s/g, ".")}@example.com`;
      const phone = `08${Math.floor(Math.random() * 10000000000).toString().padStart(10, "0")}`;
      
      const [existing] = await db
        .select()
        .from(customers)
        .where({ email, organizationId: orgId });
      
      if (!existing) {
        const [created] = await db
          .insert(customers)
          .values({
            organizationId: orgId,
            name,
            email,
            phone,
            createdAt: randomDate(60),
          })
          .returning();
        createdCustomers.push(created);
        process.stdout.write(`.`);
      } else {
        createdCustomers.push(existing);
      }
    }
    console.log(`\n  ✅ Created ${createdCustomers.length} customers\n`);

    // 4. Create Orders
    console.log("🛍️  Creating orders (this may take a while)...");
    const orderCount = 50;
    const createdOrders = [];

    for (let i = 0; i < orderCount; i++) {
      const customer = createdCustomers[Math.floor(Math.random() * createdCustomers.length)];
      const branch = existingBranches[Math.floor(Math.random() * existingBranches.length)];
      const orderStatus = orderStatuses[Math.floor(Math.random() * orderStatuses.length)];
      const paymentStatus = paymentStatuses[Math.floor(Math.random() * paymentStatuses.length)];
      const paymentMethod = paymentMethods[Math.floor(Math.random() * paymentMethods.length)];
      
      const orderNumber = generateOrderNumber(i);
      const orderDate = randomDate(30);
      
      // Calculate items and total
      const itemCount = Math.floor(Math.random() * 5) + 1;
      let subtotal = 0;
      const orderItems_data = [];

      for (let j = 0; j < itemCount; j++) {
        const product = existingProducts[Math.floor(Math.random() * existingProducts.length)];
        const quantity = Math.floor(Math.random() * 5) + 1;
        const unitPrice = Math.floor(Math.random() * 50000) + 10000;
        const itemTotal = quantity * unitPrice;
        subtotal += itemTotal;
        
        orderItems_data.push({
          inventoryProductId: product.id,
          productName: product.name,
          quantity,
          unitPrice,
          totalPrice: itemTotal,
        });
      }

      const tax = Math.floor(subtotal * 0.11); // 11% tax
      const discount = Math.floor(Math.random() * 10000);
      const totalAmount = subtotal + tax - discount;

      // Create order
      const [order] = await db
        .insert(orders)
        .values({
          organizationId: orgId,
          branchId: branch.id,
          customerId: customer.id,
          orderNumber,
          status: orderStatus,
          paymentStatus,
          paymentMethod,
          subtotal,
          tax,
          discount,
          totalAmount,
          notes: Math.random() > 0.8 ? "Catatan pelanggan" : null,
          createdAt: orderDate,
          updatedAt: orderDate,
        })
        .returning();

      // Create order items
      for (const item of orderItems_data) {
        await db.insert(orderItems).values({
          organizationId: orgId,
          orderId: order.id,
          ...item,
        });
      }

      // Create payment record if paid
      if (paymentStatus === "paid") {
        await db.insert(payments).values({
          organizationId: orgId,
          orderId: order.id,
          amount: totalAmount,
          method: paymentMethod,
          status: "SUCCESS",
          reference: `PAY-${orderNumber}`,
          paidAt: orderDate,
          createdAt: orderDate,
        });
      }

      createdOrders.push(order);
      
      if ((i + 1) % 10 === 0) {
        process.stdout.write(` ${i + 1}/${orderCount}`);
      }
    }

    console.log(`\n  ✅ Created ${createdOrders.length} orders\n`);

    // Summary
    console.log("✨ Orders seeding completed!");
    console.log(`   Customers: ${createdCustomers.length}`);
    console.log(`   Orders: ${createdOrders.length}`);
    console.log(`   Branches used: ${existingBranches.length}`);
    console.log(`   Products used: ${existingProducts.length}`);

  } catch (error) {
    console.error("\n❌ Seeding failed:", error);
    process.exit(1);
  }

  process.exit(0);
}

seed();
