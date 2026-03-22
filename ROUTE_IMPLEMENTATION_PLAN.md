# Implementation Plan: Navbar Routes Boilerplate

## Overview
Membuat boilerplate untuk 18 route yang direferensikan di navbar tetapi belum ada.

## Struktur Folder yang Akan Dibuat

```
apps/web/app/
├── fitur/
│   ├── kasir/page.tsx
│   ├── inventori/page.tsx
│   ├── laporan/page.tsx
│   ├── pengiriman/page.tsx
│   ├── multi-cabang/page.tsx
│   └── tim/page.tsx
├── solusi/
│   ├── laundry/page.tsx
│   ├── fnb/page.tsx
│   ├── retail/page.tsx
│   ├── salon/page.tsx
│   └── franchise/page.tsx
├── docs/page.tsx
├── changelog/page.tsx
├── about/page.tsx
├── blog/page.tsx
├── careers/page.tsx
└── partnership/page.tsx
```

## Pattern yang Digunakan

Setiap page akan mengikuti pola yang sudah ada:

1. **Server Component** (default)
2. **PageHero** - Header dengan badge, title, subtitle, description, CTA
3. **Section** - Content sections dengan divider
4. **Feature Cards** - Grid card untuk highlight fitur/benefit
5. **FAQ Section** (opsional) - Untuk page tertentu
6. **CTA Section** - Closing dengan call-to-action

## Komponen yang Digunakan

```tsx
// Imports umum
import Link from "next/link";
import { IconName } from "lucide-react";
import { PageHero } from "../_components/PageHero";
import { Section } from "../_components/Section";
import { Button, Heading, Text } from "@repo/ui";
import { Card, CardContent, CardHeader, CardTitle } from "@repo/ui/card";
```

## Konten per Halaman

### A. Fitur Pages (6 pages)
Struktur:
- Hero dengan value proposition fitur
- 3-4 highlight cards (fitur utama)
- Workflow/How it works section
- Benefit section
- Related features (cross-link)
- CTA ke demo/wishlist

### B. Solusi Pages (5 pages)
Struktur:
- Hero dengan industry-specific value prop
- Pain points yang dipecahkan
- Fitur spesifik industri
- Use cases/scenarios
- Testimonial (placeholder)
- CTA ke demo/wishlist

### C. Resources & Company (7 pages)
Struktur sederhana:
- Hero
- Content sections
- CTA

## Metadata

Setiap page akan memiliki metadata SEO:

```tsx
export const metadata: Metadata = {
  title: "Judul Halaman",
  description: "Deskripsi SEO",
};
```

## Langkah Implementasi

1. Buat folder structure
2. Buat file page.tsx untuk masing-masing route
3. Sesuaikan konten dengan konteks bisnis
4. Tambahkan metadata SEO
5. Pastikan semua link di navbar berfungsi

## Estimasi

- 18 pages × ~80-120 lines = ~1800 lines of code
- Waktu: 1 sesi implementasi

## Catatan

- Semua page menggunakan Server Component (default Next.js)
- Tidak ada state management yang kompleks
- Icons dari lucide-react
- Styling konsisten dengan Tailwind + @repo/ui
