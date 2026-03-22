#!/usr/bin/env node
/**
 * Seed script for multi-business support testing
 * Creates a laundry business "Indomarettt" with 5 active modules
 * 
 * Usage: node scripts/seed-business.mjs
 */

import { neon } from '@neondatabase/serverless';

const DATABASE_URL = process.env.DATABASE_URL;

if (!DATABASE_URL) {
    console.error('Error: DATABASE_URL environment variable is required');
    process.exit(1);
}

const sql = neon(DATABASE_URL);

const BUSINESS_ID = '550e8400-e29b-41d4-a716-446655440001';

const MODULES = [
    {
        moduleKey: 'order',
        moduleName: 'Pesanan',
        displayOrder: 1,
        settings: { icon: 'ShoppingCart', defaultView: 'list' },
    },
    {
        moduleKey: 'tracking',
        moduleName: 'Tracking',
        displayOrder: 2,
        settings: { icon: 'MapPin', enableNotifications: true },
    },
    {
        moduleKey: 'inventory',
        moduleName: 'Inventori',
        displayOrder: 3,
        settings: { icon: 'Package', lowStockAlert: true },
    },
    {
        moduleKey: 'customer',
        moduleName: 'Pelanggan',
        displayOrder: 4,
        settings: { icon: 'Users', enableLoyalty: true },
    },
    {
        moduleKey: 'report',
        moduleName: 'Laporan',
        displayOrder: 5,
        settings: { icon: 'BarChart3', defaultPeriod: 'monthly' },
    },
];

async function seedBusiness() {
    console.log('🚀 Starting business seed...\n');

    try {
        // Check if business already exists
        const existingBusiness = await sql`
            SELECT id FROM businesses WHERE id = ${BUSINESS_ID}
        `;

        if (existingBusiness.length > 0) {
            console.log('⚠️  Business "Indomarettt Laundry" already exists. Skipping...');
            return;
        }

        // Insert laundry business
        console.log('🏪 Creating business: Indomarettt Laundry');
        await sql`
            INSERT INTO businesses (
                id, name, slug, business_type, description, 
                phone, email, address, is_active, settings
            ) VALUES (
                ${BUSINESS_ID},
                'Indomarettt Laundry',
                'indomarettt-laundry',
                'laundry',
                'Layanan laundry kilat dan bersih untuk keluarga Anda',
                '081234567890',
                'hello@indomarettt.com',
                'Jl. Laundry No. 123, Jakarta',
                true,
                ${JSON.stringify({ currency: 'IDR', timezone: 'Asia/Jakarta', taxRate: 11 })}
            )
        `;
        console.log('✅ Business created successfully\n');

        // Insert modules
        console.log('📦 Creating business modules:');
        for (const mod of MODULES) {
            await sql`
                INSERT INTO business_modules (
                    business_id, module_key, module_name, 
                    is_active, settings, display_order
                ) VALUES (
                    ${BUSINESS_ID},
                    ${mod.moduleKey},
                    ${mod.moduleName},
                    true,
                    ${JSON.stringify(mod.settings)},
                    ${mod.displayOrder}
                )
            `;
            console.log(`  ✓ ${mod.moduleName} (${mod.moduleKey})`);
        }
        console.log('');

        // Verify data
        console.log('🔍 Verifying seeded data:\n');
        
        const business = await sql`
            SELECT id, name, business_type, is_active 
            FROM businesses 
            WHERE id = ${BUSINESS_ID}
        `;
        console.log('Business:', business[0]);

        const modules = await sql`
            SELECT module_key, module_name, is_active, display_order
            FROM business_modules
            WHERE business_id = ${BUSINESS_ID}
            ORDER BY display_order
        `;
        console.log('\nModules:', modules);

        console.log('\n✨ Seed completed successfully!');

    } catch (error) {
        console.error('\n❌ Seed failed:', error.message);
        process.exit(1);
    }
}

// Run seed
seedBusiness();
