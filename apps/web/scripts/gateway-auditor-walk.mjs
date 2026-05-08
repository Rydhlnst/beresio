import { existsSync, readdirSync, readFileSync, statSync } from "node:fs";
import path from "node:path";

const WEB_ROOT = process.cwd();
const APP_ROOT = path.join(WEB_ROOT, "app");
const UI_COMPLIANCE_FILE = path.resolve(WEB_ROOT, "../../packages/ui/src/compliance.ts");

const failures = [];
const passes = [];

function addPass(message) {
    passes.push(message);
}

function addFailure(message) {
    failures.push(message);
}

function assertFileExists(relativePath) {
    const absolutePath = path.join(WEB_ROOT, relativePath);
    if (!existsSync(absolutePath)) {
        addFailure(`Missing required file: ${relativePath}`);
        return null;
    }
    addPass(`File exists: ${relativePath}`);
    return absolutePath;
}

function assertFileContains(relativePath, markers) {
    const absolutePath = assertFileExists(relativePath);
    if (!absolutePath) return;

    const content = readFileSync(absolutePath, "utf8");
    for (const marker of markers) {
        if (!content.includes(marker)) {
            addFailure(`${relativePath} missing marker: "${marker}"`);
        } else {
            addPass(`${relativePath} contains "${marker}"`);
        }
    }
}

function collectCodeFiles(directory) {
    const files = [];
    for (const entry of readdirSync(directory)) {
        const fullPath = path.join(directory, entry);
        const stats = statSync(fullPath);
        if (stats.isDirectory()) {
            files.push(...collectCodeFiles(fullPath));
            continue;
        }

        if (/\.(ts|tsx|mdx)$/i.test(entry)) {
            files.push(fullPath);
        }
    }
    return files;
}

function assertNoLegacyBranding() {
    const files = collectCodeFiles(APP_ROOT);
    const legacyPattern = /\b(Beres\.io|beres\.io|app\.beres\.io)\b/g;
    let found = false;

    for (const file of files) {
        const content = readFileSync(file, "utf8");
        if (!legacyPattern.test(content)) {
            continue;
        }
        found = true;
        const relative = path.relative(WEB_ROOT, file);
        addFailure(`Legacy branding/domain still found in ${relative}`);
    }

    if (!found) {
        addPass("No legacy branding/domain drift found in apps/web/app");
    }
}

function assertProviderMappingSchema() {
    if (!existsSync(UI_COMPLIANCE_FILE)) {
        addFailure(`Missing compliance schema file: ${path.relative(WEB_ROOT, UI_COMPLIANCE_FILE)}`);
        return;
    }

    const content = readFileSync(UI_COMPLIANCE_FILE, "utf8");
    const requiredMarkers = [
        "providerMapping",
        'provider: "midtrans"',
        'provider: "xendit"',
        "connectionState",
        "legalEntityName",
        "businessAddress",
        "supportEmail",
        "supportWhatsApp",
        "complaintChannel",
    ];

    for (const marker of requiredMarkers) {
        if (!content.includes(marker)) {
            addFailure(`Compliance schema missing: "${marker}"`);
        } else {
            addPass(`Compliance schema contains "${marker}"`);
        }
    }
}

function run() {
    assertFileContains("app/_components/Footer.tsx", [
        "/privacy",
        "/terms",
        "/refund-cancellation",
        "/billing/checkout",
        "/billing/status/INV-DEMO-240415",
    ]);

    assertFileContains("app/_components/Navbar.tsx", [
        "/billing/checkout",
        "/privacy",
        "/support",
    ]);

    assertFileContains("app/(marketing)/privacy/page.tsx", [
        "legalEntityName",
        "businessAddress",
        "supportEmail",
        "complaintChannel",
        "legalVersion",
        "legalEffectiveDate",
    ]);

    assertFileContains("app/(marketing)/terms/page.tsx", [
        "legalEntityName",
        "legalVersion",
        "legalEffectiveDate",
        "/refund-cancellation",
    ]);

    assertFileContains("app/(marketing)/refund-cancellation/page.tsx", [
        "supportEmail",
        "complaintChannel",
        "businessHours",
        "legalEntityName",
    ]);

    assertFileContains("app/(marketing)/billing/checkout/page.tsx", [
        "Demo",
        "pending",
        "privacy",
        "terms",
        "refund-cancellation",
        "providerMapping",
    ]);

    assertFileContains("app/(marketing)/billing/status/[reference]/page.tsx", [
        "pending",
        "paid",
        "failed",
        "expired",
    ]);

    assertFileContains("app/(marketing)/harga/page.tsx", [
        "/billing/checkout",
        "/billing/status/INV-DEMO-240415",
        "Midtrans",
        "Xendit",
    ]);

    assertNoLegacyBranding();
    assertProviderMappingSchema();

    if (failures.length > 0) {
        console.error("GATEWAY AUDITOR WALK: FAILED");
        for (const failure of failures) {
            console.error(`- ${failure}`);
        }
        process.exitCode = 1;
        return;
    }

    console.log("GATEWAY AUDITOR WALK: PASSED");
    for (const pass of passes) {
        console.log(`- ${pass}`);
    }
}

run();
