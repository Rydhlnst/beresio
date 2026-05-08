"use client";

import { useMemo, useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { toast } from "sonner";

import {
    betaApplicationSchema,
    type BetaApplicationFormInput,
    type BetaApplicationFormValues,
} from "@/lib/validations/beta-application";
import { createBetaApplicationAction } from "../actions";

import { Button } from "@repo/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@repo/ui/card";
import { Checkbox } from "@repo/ui/checkbox";
import { Input } from "@repo/ui/input";
import { Textarea } from "@repo/ui/textarea";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@repo/ui/form";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@repo/ui/select";
import { cn } from "@repo/ui/lib/utils";

type BetaApplicationFormProps = {
    defaultValues?: Partial<BetaApplicationFormInput>;
    existingApplicationId?: string | null;
};

const BUSINESS_TYPE_LABEL: Record<BetaApplicationFormValues["businessType"], string> = {
    fnb: "F&B",
    retail: "Retail",
    laundry: "Laundry",
    grocery: "Grocery",
    services: "Services",
    other: "Other",
};

const BUSINESS_SIZE_LABEL: Record<BetaApplicationFormValues["businessSize"], string> = {
    solo: "Solo / Owner only",
    "1_5": "1-5 employees",
    "6_20": "6-20 employees",
    "21_50": "21-50 employees",
    "50_plus": "50+ employees",
};

const READINESS_LABEL: Record<BetaApplicationFormValues["betaReadiness"], string> = {
    curious: "Just curious",
    interested_not_urgent: "Interested but not urgent",
    ready_soon: "Ready to test soon",
    urgent: "Need solution urgently",
};

const MODULE_LABEL: Record<BetaApplicationFormValues["interestedModules"][number], string> = {
    pos: "POS",
    inventory: "Inventory",
    finance_accounting: "Finance / Accounting",
    multi_branch_management: "Multi-branch Management",
    online_ordering: "Online Ordering",
    delivery_fulfillment: "Delivery / Fulfillment",
    reports_analytics: "Reports & Analytics",
    ai_assistant: "AI Assistant",
};

const SOURCE_OPTIONS = [
    { value: "Instagram", label: "Instagram", description: "Konten, iklan, atau DM." },
    { value: "TikTok", label: "TikTok", description: "Video atau iklan TikTok." },
    { value: "Google", label: "Google", description: "Pencarian atau rekomendasi Google." },
    { value: "Website", label: "Website", description: "Website Beres / artikel." },
    { value: "YouTube", label: "YouTube", description: "Video review atau tutorial." },
    { value: "Teman/Referral", label: "Teman / Referral", description: "Direkomendasikan rekan." },
    { value: "Komunitas/Event", label: "Komunitas / Event", description: "Komunitas, webinar, atau event." },
] as const;

export function BetaApplicationForm({ defaultValues, existingApplicationId }: BetaApplicationFormProps) {
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [submittedId, setSubmittedId] = useState<string | null>(existingApplicationId ?? null);
    const [customSource, setCustomSource] = useState(() => {
        const initialValue = (defaultValues?.source ?? "").toString().trim();
        if (!initialValue) return "";
        return SOURCE_OPTIONS.some((option) => option.value === initialValue) ? "" : initialValue;
    });
    const [isOtherSource, setIsOtherSource] = useState(() => customSource.length > 0);

    const mergedDefaults = useMemo(() => {
        return {
            fullName: "",
            email: "",
            phoneNumber: "",
            companyName: "",
            roleInCompany: "",
            businessType: undefined,
            businessSize: undefined,
            numberOfBranches: 1,
            currentToolsUsed: "",
            mainOperationalProblem: "",
            currentBiggestChallenge: "",
            expectedSolutionFromBeres: "",
            interestedModules: [],
            betaReadiness: undefined,
            willingnessToGiveFeedback: false,
            source: "",
            ...defaultValues,
        } satisfies Partial<BetaApplicationFormInput>;
    }, [defaultValues]);

    const form = useForm<BetaApplicationFormInput, any, BetaApplicationFormValues>({
        resolver: zodResolver(betaApplicationSchema),
        defaultValues: mergedDefaults as BetaApplicationFormInput,
    });

    async function onSubmit(values: BetaApplicationFormInput) {
        setIsSubmitting(true);
        try {
            const result = await createBetaApplicationAction(values);

            if (!result.success) {
                if (result.fieldErrors) {
                    for (const [fieldName, messages] of Object.entries(result.fieldErrors)) {
                        const message = messages?.[0];
                        if (!message) continue;
                        form.setError(fieldName as keyof BetaApplicationFormInput, {
                            type: "server",
                            message,
                        });
                    }
                }
                toast.error(result.error || "Gagal mengirim aplikasi beta.");
                return;
            }

            setSubmittedId(result.data.id);
            toast.success(
                result.data.alreadyRegistered
                    ? "Email ini sudah terdaftar di waitlist beta."
                    : "Terima kasih! Pendaftaran waitlist beta berhasil dikirim."
            );
        } catch (error) {
            console.error(error);
            toast.error("Terjadi kesalahan. Coba lagi.");
        } finally {
            setIsSubmitting(false);
        }
    }

    if (submittedId) {
        return (
            <Card className="border-border/60">
                <CardHeader className="space-y-2">
                    <CardTitle className="text-xl">Anda Sudah Terdaftar</CardTitle>
                    <p className="text-sm text-muted-foreground">
                        Tim Beres Cloud akan review pendaftaran Anda. Kami akan menghubungi via email/WhatsApp jika cocok untuk early access.
                    </p>
                </CardHeader>
                <CardContent className="space-y-2">
                    <div className="rounded-xl border border-border/60 bg-secondary/40 p-4">
                        <p className="text-xs font-semibold uppercase tracking-[0.16em] text-muted-foreground">
                            Reference ID
                        </p>
                        <p className="mt-1 font-mono text-sm text-foreground">{submittedId}</p>
                    </div>
                </CardContent>
            </Card>
        );
    }

    return (
        <Card className="border-border/60">
            <CardHeader className="space-y-2">
                <CardTitle className="text-xl">Form Waitlist Beta</CardTitle>
                <p className="text-sm text-muted-foreground">
                    Isi form ini agar tim bisa menilai kecocokan dan menentukan prioritas early access.
                </p>
            </CardHeader>
            <CardContent>
                <Form {...form}>
                    <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-8">
                        <section className="space-y-4">
                            <p className="text-xs font-semibold uppercase tracking-[0.16em] text-muted-foreground">
                                Identitas
                            </p>
                            <div className="grid gap-4 md:grid-cols-2">
                                <FormField
                                    control={form.control}
                                    name="fullName"
                                    render={({ field }) => (
                                        <FormItem>
                                            <FormLabel>Nama lengkap</FormLabel>
                                            <FormControl>
                                                <Input placeholder="Riyan Nasution" disabled={isSubmitting} {...field} />
                                            </FormControl>
                                            <FormMessage />
                                        </FormItem>
                                    )}
                                />
                                <FormField
                                    control={form.control}
                                    name="email"
                                    render={({ field }) => (
                                        <FormItem>
                                            <FormLabel>Email</FormLabel>
                                            <FormControl>
                                                <Input type="email" placeholder="riyan@contoh.com" autoComplete="email" disabled={isSubmitting} {...field} />
                                            </FormControl>
                                            <FormMessage />
                                        </FormItem>
                                    )}
                                />
                                <FormField
                                    control={form.control}
                                    name="phoneNumber"
                                    render={({ field }) => (
                                        <FormItem>
                                            <FormLabel>Nomor WhatsApp</FormLabel>
                                            <FormControl>
                                                <Input placeholder="+62 812-3456-7890" autoComplete="tel" disabled={isSubmitting} {...field} />
                                            </FormControl>
                                            <FormMessage />
                                        </FormItem>
                                    )}
                                />
                                <FormField
                                    control={form.control}
                                    name="companyName"
                                    render={({ field }) => (
                                        <FormItem>
                                            <FormLabel>Nama bisnis</FormLabel>
                                            <FormControl>
                                                <Input placeholder="Laundry Bersih Jaya" disabled={isSubmitting} {...field} />
                                            </FormControl>
                                            <FormMessage />
                                        </FormItem>
                                    )}
                                />
                                <FormField
                                    control={form.control}
                                    name="roleInCompany"
                                    render={({ field }) => (
                                        <FormItem className="md:col-span-2">
                                            <FormLabel>Peran Anda</FormLabel>
                                            <FormControl>
                                                <Input placeholder="Owner / Manager / Admin" disabled={isSubmitting} {...field} />
                                            </FormControl>
                                            <FormMessage />
                                        </FormItem>
                                    )}
                                />
                            </div>
                        </section>

                        <section className="space-y-4">
                            <p className="text-xs font-semibold uppercase tracking-[0.16em] text-muted-foreground">
                                Informasi bisnis
                            </p>
                            <div className="grid gap-4 md:grid-cols-2">
                                <FormField
                                    control={form.control}
                                    name="businessType"
                                    render={({ field }) => (
                                        <FormItem>
                                            <FormLabel>Jenis bisnis</FormLabel>
                                            <Select onValueChange={field.onChange} value={field.value} disabled={isSubmitting}>
                                                <FormControl>
                                                    <SelectTrigger>
                                                        <SelectValue placeholder="Pilih jenis bisnis" />
                                                    </SelectTrigger>
                                                </FormControl>
                                                <SelectContent>
                                                    {Object.entries(BUSINESS_TYPE_LABEL).map(([value, label]) => (
                                                        <SelectItem key={value} value={value}>
                                                            {label}
                                                        </SelectItem>
                                                    ))}
                                                </SelectContent>
                                            </Select>
                                            <FormMessage />
                                        </FormItem>
                                    )}
                                />
                                <FormField
                                    control={form.control}
                                    name="businessSize"
                                    render={({ field }) => (
                                        <FormItem>
                                            <FormLabel>Skala bisnis</FormLabel>
                                            <Select onValueChange={field.onChange} value={field.value} disabled={isSubmitting}>
                                                <FormControl>
                                                    <SelectTrigger>
                                                        <SelectValue placeholder="Pilih skala bisnis" />
                                                    </SelectTrigger>
                                                </FormControl>
                                                <SelectContent>
                                                    {Object.entries(BUSINESS_SIZE_LABEL).map(([value, label]) => (
                                                        <SelectItem key={value} value={value}>
                                                            {label}
                                                        </SelectItem>
                                                    ))}
                                                </SelectContent>
                                            </Select>
                                            <FormMessage />
                                        </FormItem>
                                    )}
                                />
                                <FormField
                                    control={form.control}
                                    name="numberOfBranches"
                                    render={({ field }) => (
                                        <FormItem>
                                            <FormLabel>Jumlah cabang</FormLabel>
                                            <FormControl>
                                                <Input type="number" min={1} placeholder="1" disabled={isSubmitting} {...field} />
                                            </FormControl>
                                            <FormMessage />
                                        </FormItem>
                                    )}
                                />
                                <FormField
                                    control={form.control}
                                    name="currentToolsUsed"
                                    render={({ field }) => (
                                        <FormItem className="md:col-span-2">
                                            <FormLabel>Tools yang dipakai sekarang</FormLabel>
                                            <FormControl>
                                                <Textarea
                                                    placeholder="Contoh: Excel, BukuWarung, Moka, catatan manual, sistem custom, dll."
                                                    className="min-h-[96px]"
                                                    disabled={isSubmitting}
                                                    {...field}
                                                />
                                            </FormControl>
                                            <FormMessage />
                                        </FormItem>
                                    )}
                                />
                            </div>
                        </section>

                        <section className="space-y-4">
                            <p className="text-xs font-semibold uppercase tracking-[0.16em] text-muted-foreground">
                                Pain points
                            </p>
                            <div className="grid gap-4">
                                <FormField
                                    control={form.control}
                                    name="mainOperationalProblem"
                                    render={({ field }) => (
                                        <FormItem>
                                            <FormLabel>Masalah operasional utama</FormLabel>
                                            <FormControl>
                                                <Textarea className="min-h-[96px]" disabled={isSubmitting} {...field} />
                                            </FormControl>
                                            <FormMessage />
                                        </FormItem>
                                    )}
                                />
                                <FormField
                                    control={form.control}
                                    name="currentBiggestChallenge"
                                    render={({ field }) => (
                                        <FormItem>
                                            <FormLabel>Tantangan terbesar saat ini</FormLabel>
                                            <FormControl>
                                                <Textarea className="min-h-[96px]" disabled={isSubmitting} {...field} />
                                            </FormControl>
                                            <FormMessage />
                                        </FormItem>
                                    )}
                                />
                                <FormField
                                    control={form.control}
                                    name="expectedSolutionFromBeres"
                                    render={({ field }) => (
                                        <FormItem>
                                            <FormLabel>Ekspektasi dari Beres Cloud</FormLabel>
                                            <FormControl>
                                                <Textarea className="min-h-[96px]" disabled={isSubmitting} {...field} />
                                            </FormControl>
                                            <FormMessage />
                                        </FormItem>
                                    )}
                                />
                            </div>
                        </section>

                        <section className="space-y-4">
                            <p className="text-xs font-semibold uppercase tracking-[0.16em] text-muted-foreground">
                                Kesiapan beta
                            </p>
                            <div className="grid gap-5">
                                <FormField
                                    control={form.control}
                                    name="interestedModules"
                                    render={({ field }) => (
                                        <FormItem>
                                            <FormLabel>Modul yang diminati</FormLabel>
                                            <div className="mt-2 grid gap-2 sm:grid-cols-2">
                                                {Object.entries(MODULE_LABEL).map(([value, label]) => {
                                                    const checked = field.value?.includes(value as any) ?? false;
                                                    return (
                                                        <label
                                                            key={value}
                                                            className="flex cursor-pointer items-start gap-3 rounded-xl border border-border/60 bg-background px-3 py-2.5 hover:bg-secondary/40"
                                                        >
                                                            <Checkbox
                                                                checked={checked}
                                                                onCheckedChange={(next) => {
                                                                    const isChecked = next === true;
                                                                    const current = field.value ?? [];
                                                                    field.onChange(
                                                                        isChecked
                                                                            ? [...current, value]
                                                                            : current.filter((item) => item !== value)
                                                                    );
                                                                }}
                                                                className="mt-0.5"
                                                                disabled={isSubmitting}
                                                            />
                                                            <span className="text-sm text-foreground">{label}</span>
                                                        </label>
                                                    );
                                                })}
                                            </div>
                                            <FormMessage />
                                        </FormItem>
                                    )}
                                />

                                <div className="grid gap-4 md:grid-cols-2">
                                    <FormField
                                        control={form.control}
                                        name="betaReadiness"
                                        render={({ field }) => (
                                            <FormItem>
                                                <FormLabel>Kapan butuh solusi?</FormLabel>
                                                <Select onValueChange={field.onChange} value={field.value} disabled={isSubmitting}>
                                                    <FormControl>
                                                        <SelectTrigger>
                                                            <SelectValue placeholder="Pilih kesiapan" />
                                                        </SelectTrigger>
                                                    </FormControl>
                                                    <SelectContent>
                                                        {Object.entries(READINESS_LABEL).map(([value, label]) => (
                                                            <SelectItem key={value} value={value}>
                                                                {label}
                                                            </SelectItem>
                                                        ))}
                                                    </SelectContent>
                                                </Select>
                                                <FormMessage />
                                            </FormItem>
                                        )}
                                    />
                                    <FormField
                                        control={form.control}
                                        name="willingnessToGiveFeedback"
                                        render={({ field }) => (
                                            <FormItem className="flex items-start gap-3 rounded-xl border border-border/60 bg-background px-4 py-3">
                                                <FormControl>
                                                    <Checkbox
                                                        checked={field.value}
                                                        onCheckedChange={(next) => field.onChange(next === true)}
                                                        className="mt-0.5"
                                                        disabled={isSubmitting}
                                                    />
                                                </FormControl>
                                                <div className="space-y-1 leading-none">
                                                    <FormLabel>Saya bersedia memberi feedback rutin</FormLabel>
                                                    <FormMessage />
                                                </div>
                                            </FormItem>
                                        )}
                                    />
                                </div>
                            </div>
                        </section>

                        <section className="space-y-4">
                            <p className="text-xs font-semibold uppercase tracking-[0.16em] text-muted-foreground">
                                Metadata
                            </p>
                            <div className="grid gap-4 md:grid-cols-2">
                                <FormField
                                    control={form.control}
                                    name="source"
                                    render={({ field }) => (
                                        <FormItem className="md:col-span-2">
                                            <FormLabel>Dari mana Anda mengenal Beres? (opsional)</FormLabel>
                                            <FormControl>
                                                <div className="grid gap-3 md:grid-cols-2">
                                                    {SOURCE_OPTIONS.map((option) => {
                                                        const isActive = field.value === option.value;
                                                        return (
                                                            <button
                                                                key={option.value}
                                                                type="button"
                                                                onClick={() => {
                                                                    setCustomSource("");
                                                                    setIsOtherSource(false);
                                                                    field.onChange(option.value);
                                                                }}
                                                                className={cn(
                                                                    "group rounded-xl border border-border/60 bg-background p-4 text-left transition-colors hover:bg-muted/30",
                                                                    isActive && "border-primary/35 bg-primary/10"
                                                                )}
                                                                disabled={isSubmitting}
                                                            >
                                                                <p className={cn("text-sm font-semibold text-foreground", isActive && "text-primary")}>
                                                                    {option.label}
                                                                </p>
                                                                <p className="mt-1 text-sm text-muted-foreground">
                                                                    {option.description}
                                                                </p>
                                                            </button>
                                                        );
                                                    })}

                                                    <button
                                                        type="button"
                                                        onClick={() => {
                                                            setIsOtherSource(true);
                                                            if (SOURCE_OPTIONS.some((option) => option.value === field.value)) {
                                                                field.onChange(customSource);
                                                            }
                                                        }}
                                                        className={cn(
                                                            "rounded-xl border border-border/60 bg-background p-4 text-left transition-colors hover:bg-muted/30",
                                                            isOtherSource && "border-primary/35 bg-primary/10"
                                                        )}
                                                        disabled={isSubmitting}
                                                    >
                                                        <p className={cn("text-sm font-semibold text-foreground", isOtherSource && "text-primary")}>
                                                            Lainnya
                                                        </p>
                                                        <p className="mt-1 text-sm text-muted-foreground">
                                                            Isi sumber lain bila tidak ada di pilihan.
                                                        </p>
                                                    </button>
                                                </div>
                                            </FormControl>

                                            {isOtherSource && (
                                                <div className="mt-3">
                                                    <Input
                                                        value={customSource}
                                                        onChange={(event) => {
                                                            const nextValue = event.target.value;
                                                            setCustomSource(nextValue);
                                                            field.onChange(nextValue);
                                                        }}
                                                        placeholder="Tulis sumbernya, mis. grup WhatsApp, konsultan, marketplace, dll."
                                                        disabled={isSubmitting}
                                                    />
                                                </div>
                                            )}
                                            <FormMessage />
                                        </FormItem>
                                    )}
                                />
                            </div>
                        </section>

                        <Button type="submit" className="w-full" disabled={isSubmitting}>
                            {isSubmitting ? "Mengirim..." : "Daftar Waitlist Beta"}
                        </Button>
                    </form>
                </Form>
            </CardContent>
        </Card>
    );
}
