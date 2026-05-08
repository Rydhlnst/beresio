"use client";

import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useState } from "react";
import { toast } from "sonner";
import { z } from "zod";
import { Loader2 } from "lucide-react";

import { authClient } from "@/lib/auth-client";
import { normalizeBusinessType } from "@/lib/business-type";
import { useTransitionRouter } from "@/hooks/use-transition-router";
import { bootstrapRbacForActiveOrg } from "../../_actions/rbac";
import { updateOnboardingMetadataAction } from "../../_actions/organization";

import { Button } from "@repo/ui/button";
import { Input } from "@repo/ui/input";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@repo/ui/form";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@repo/ui/select";
import { BriefcaseBusiness, Building2, Coffee, Store, Truck } from "lucide-react";

const orgSchema = z.object({
  name: z.string().min(3, "Nama bisnis minimal 3 karakter").max(50, "Nama bisnis maksimal 50 karakter"),
  businessType: z.string({
    required_error: "Pilih tipe bisnis kamu",
  }),
});

type OrgFormValues = z.infer<typeof orgSchema>;

const BUSINESS_TYPES = [
  { value: "fnb", label: "F&B", icon: Coffee },
  { value: "retail", label: "Retail", icon: Store },
  { value: "service", label: "Services", icon: BriefcaseBusiness },
  { value: "wholesale", label: "Wholesale", icon: Truck },
  { value: "other", label: "Lainnya", icon: Building2 },
];

export function OrgOnboardingForm() {
  const { replace } = useTransitionRouter();
  const [isLoading, setIsLoading] = useState(false);

  const form = useForm<OrgFormValues>({
    resolver: zodResolver(orgSchema),
    defaultValues: {
      name: "",
      businessType: "",
    },
  });

  async function onSubmit(values: OrgFormValues) {
    setIsLoading(true);
    try {
      const { data, error } = await authClient.organization.create({
        name: values.name,
        slug: values.name.toLowerCase().replace(/\s+/g, "-").replace(/[^a-z0-9-]/g, ""),
        businessType: normalizeBusinessType(values.businessType),
      });

      if (error) {
        toast.error(error.message || "Gagal membuat bisnis. Silakan coba lagi.");
        return;
      }

      const orgId = (data as any)?.organization?.id ?? (data as any)?.id;
      if (orgId) {
        await (authClient.organization as any).setActiveOrganization({
          organizationId: orgId,
        });
      }

      const bootstrapResult = await bootstrapRbacForActiveOrg();
      if (!bootstrapResult.ok) {
        toast.error("Role akses belum tersinkron. Silakan refresh setelah onboarding.");
      }

      await updateOnboardingMetadataAction({
        profileCompleted: true,
        profileCompletedAt: new Date().toISOString(),
        modeSelected: true,
        modeSelectedAt: new Date().toISOString(),
      });

      toast.success("Bisnis berhasil didaftarkan!");
      replace("/onboarding/branch");
    } catch {
      toast.error("Terjadi kesalahan sistem. Silakan coba lagi nanti.");
    } finally {
      setIsLoading(false);
    }
  }

  return (
    <div className="space-y-5">
      <div className="space-y-1">
        <h3 className="text-xl font-semibold text-foreground">Informasi Usaha</h3>
        <p className="text-sm text-muted-foreground">Nama ini adalah entitas bisnis utama yang menaungi seluruh cabang.</p>
      </div>

      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
          <FormField
            control={form.control}
            name="name"
            render={({ field }) => (
              <FormItem>
                <FormLabel className="text-xs font-semibold uppercase tracking-[0.12em] text-muted-foreground">
                  Nama Usaha Utama
                </FormLabel>
                <FormControl>
                  <Input placeholder="Contoh: Beres Laundry Group" disabled={isLoading} {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="businessType"
            render={({ field }) => (
              <FormItem>
                <FormLabel className="text-xs font-semibold uppercase tracking-[0.12em] text-muted-foreground">
                  Tipe Bisnis
                </FormLabel>
                <Select onValueChange={field.onChange} defaultValue={field.value} disabled={isLoading}>
                  <FormControl>
                    <SelectTrigger>
                      <SelectValue placeholder="Pilih tipe bisnis" />
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent>
                    {BUSINESS_TYPES.map((type) => (
                      <SelectItem key={type.value} value={type.value}>
                        <div className="flex items-center gap-2">
                          <type.icon className="h-4 w-4 text-muted-foreground" />
                          <span>{type.label}</span>
                        </div>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <FormMessage />
              </FormItem>
            )}
          />

          <div className="flex items-center justify-end pt-2">
            <Button type="submit" className="min-w-44" disabled={isLoading}>
              {isLoading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Sedang Memproses...
                </>
              ) : (
                "Lanjutkan"
              )}
            </Button>
          </div>
        </form>
      </Form>
    </div>
  );
}
