"use client";

/**
 * Structured Data (JSON-LD) Component
 * 
 * Renders Schema.org structured data as a script tag.
 * Use this for page-specific structured data like FAQs, Products, Articles.
 */

interface StructuredDataProps {
    data: Record<string, unknown> | Record<string, unknown>[];
}

export function StructuredData({ data }: StructuredDataProps) {
    return (
        <script
            type="application/ld+json"
            dangerouslySetInnerHTML={{ __html: JSON.stringify(data) }}
        />
    );
}

// ── Pre-built Structured Data Components ─────────────────────────────────────

interface BreadcrumbStructuredDataProps {
    items: { name: string; url: string }[];
}

export function BreadcrumbStructuredData({ items }: BreadcrumbStructuredDataProps) {
    const schema = {
        "@context": "https://schema.org",
        "@type": "BreadcrumbList",
        itemListElement: items.map((item, index) => ({
            "@type": "ListItem",
            position: index + 1,
            name: item.name,
            item: item.url,
        })),
    };

    return <StructuredData data={schema} />;
}

interface FAQStructuredDataProps {
    faqs: { question: string; answer: string }[];
}

export function FAQStructuredData({ faqs }: FAQStructuredDataProps) {
    const schema = {
        "@context": "https://schema.org",
        "@type": "FAQPage",
        mainEntity: faqs.map((faq) => ({
            "@type": "Question",
            name: faq.question,
            acceptedAnswer: {
                "@type": "Answer",
                text: faq.answer,
            },
        })),
    };

    return <StructuredData data={schema} />;
}

interface ProductStructuredDataProps {
    name: string;
    description: string;
    image?: string;
    offers?: {
        name: string;
        price: string;
        priceCurrency?: string;
        description?: string;
    }[];
}

export function ProductStructuredData({
    name,
    description,
    image,
    offers,
}: ProductStructuredDataProps) {
    const siteUrl = process.env.NEXT_PUBLIC_SITE_URL ?? "https://beres.cloud";
    
    const schema: Record<string, unknown> = {
        "@context": "https://schema.org",
        "@type": "SoftwareApplication",
        name,
        description,
        applicationCategory: "BusinessApplication",
        operatingSystem: "Web, iOS, Android",
        url: siteUrl,
        publisher: {
            "@type": "Organization",
            name: "Beres Cloud",
            url: siteUrl,
        },
    };

    if (image) {
        schema.image = image.startsWith("http") ? image : `${siteUrl}${image}`;
    }

    if (offers && offers.length > 0) {
        schema.offers = offers.map((offer) => ({
            "@type": "Offer",
            name: offer.name,
            price: offer.price,
            priceCurrency: offer.priceCurrency ?? "IDR",
            description: offer.description,
        }));
    }

    return <StructuredData data={schema} />;
}

interface ArticleStructuredDataProps {
    headline: string;
    description: string;
    image: string;
    datePublished: string;
    dateModified?: string;
    author?: string;
    url?: string;
}

export function ArticleStructuredData({
    headline,
    description,
    image,
    datePublished,
    dateModified,
    author,
    url,
}: ArticleStructuredDataProps) {
    const siteUrl = process.env.NEXT_PUBLIC_SITE_URL ?? "https://beres.cloud";
    
    const schema = {
        "@context": "https://schema.org",
        "@type": "Article",
        headline,
        description,
        image: image.startsWith("http") ? image : `${siteUrl}${image}`,
        datePublished,
        dateModified: dateModified ?? datePublished,
        author: {
            "@type": "Organization",
            name: author ?? "Beres Cloud",
            url: siteUrl,
        },
        publisher: {
            "@type": "Organization",
            name: "Beres Cloud",
            url: siteUrl,
            logo: {
                "@type": "ImageObject",
                url: `${siteUrl}/logo.svg`,
            },
        },
        url: url ? (url.startsWith("http") ? url : `${siteUrl}${url}`) : siteUrl,
    };

    return <StructuredData data={schema} />;
}

interface LocalBusinessStructuredDataProps {
    name: string;
    description: string;
    image?: string;
    address?: {
        streetAddress?: string;
        addressLocality?: string;
        addressRegion?: string;
        postalCode?: string;
        addressCountry?: string;
    };
    telephone?: string;
    email?: string;
    priceRange?: string;
}

export function LocalBusinessStructuredData({
    name,
    description,
    image,
    address,
    telephone,
    email,
    priceRange = "Rp",
}: LocalBusinessStructuredDataProps) {
    const siteUrl = process.env.NEXT_PUBLIC_SITE_URL ?? "https://beres.cloud";
    
    const schema: Record<string, unknown> = {
        "@context": "https://schema.org",
        "@type": "LocalBusiness",
        name,
        description,
        url: siteUrl,
        priceRange,
    };

    if (image) {
        schema.image = image.startsWith("http") ? image : `${siteUrl}${image}`;
    }

    if (address) {
        schema.address = {
            "@type": "PostalAddress",
            ...address,
        };
    }

    if (telephone) schema.telephone = telephone;
    if (email) schema.email = email;

    return <StructuredData data={schema} />;
}

