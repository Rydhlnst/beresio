import { useCallback, useEffect, useMemo, useState } from "react";
import { ActivityIndicator, Pressable, ScrollView, StyleSheet } from "react-native";
import { useLocalSearchParams, useRouter } from "expo-router";

import { Text, View } from "@/components/Themed";
import {
  authClient,
  useSession,
} from "@/lib/auth-client";
import {
  fetchBusinessNavigation,
  isBusinessType,
  normalizeBusinessType,
  pickPrimaryModule,
  pickActiveOrganization,
  type BusinessNavItem,
  type BusinessNavResponse,
  type OrganizationSummary,
} from "@/lib/business-navigation";

const BUSINESS_TYPE_LABEL: Record<string, string> = {
  laundry: "Laundry",
  fnb: "F&B",
  retail: "Retail",
};

export default function VerticalBusinessScreen() {
  const router = useRouter();
  const { businessType: businessTypeParam } = useLocalSearchParams<{ businessType?: string }>();
  const { data: session } = useSession();

  const requestedBusinessType = useMemo(
    () => normalizeBusinessType(isBusinessType(businessTypeParam) ? businessTypeParam : "retail"),
    [businessTypeParam]
  );

  const [isLoading, setIsLoading] = useState(true);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [activeOrganization, setActiveOrganization] = useState<OrganizationSummary | null>(null);
  const [navigationData, setNavigationData] = useState<BusinessNavResponse | null>(null);

  const loadData = useCallback(async () => {
    setIsLoading(true);
    setErrorMessage(null);

    try {
      const orgResponse = await authClient.organization.list();
      const organizations = (orgResponse?.data ?? []) as OrganizationSummary[];
      const activeOrganizationId =
        (session as any)?.session?.activeOrganizationId ??
        (session as any)?.activeOrganizationId ??
        organizations[0]?.id ??
        null;
      const activeOrg = pickActiveOrganization(organizations, activeOrganizationId);
      setActiveOrganization(activeOrg);

      if (!activeOrg) {
        setNavigationData(null);
        setErrorMessage("Belum ada organisasi aktif. Selesaikan onboarding dulu.");
        return;
      }

      const navResponse = await fetchBusinessNavigation(activeOrg.id);
      if (!navResponse.data) {
        setNavigationData(null);
        setErrorMessage(navResponse.errorMessage || "Tidak bisa mengambil navigation dari backend.");
        return;
      }

      setNavigationData(navResponse.data);
    } catch (error) {
      setNavigationData(null);
      setErrorMessage(
        error instanceof Error ? error.message : "Terjadi error saat memuat vertical dashboard."
      );
    } finally {
      setIsLoading(false);
    }
  }, [session]);

  useEffect(() => {
    void loadData();
  }, [loadData]);

  const businessType = navigationData?.business.type ?? requestedBusinessType;
  const businessTypeLabel = BUSINESS_TYPE_LABEL[businessType] ?? businessType;
  const verticalModules = navigationData?.navigationVertical ?? [];
  const baseModules = navigationData?.navigationBase ?? [];
  const primaryModule = pickPrimaryModule(navigationData);

  return (
    <ScrollView contentContainerStyle={styles.content}>
      <Text style={styles.title}>{businessTypeLabel} Vertical</Text>
      <Text style={styles.subtitle}>Screen ini hasil auto-redirect dari business type organisasi aktif.</Text>

      {isLoading ? (
        <View style={styles.centerState}>
          <ActivityIndicator size="small" />
          <Text style={styles.stateText}>Memuat vertical data...</Text>
        </View>
      ) : null}

      {!isLoading && errorMessage ? (
        <View style={styles.errorBox} lightColor="#fef2f2" darkColor="#450a0a">
          <Text style={styles.errorText}>{errorMessage}</Text>
        </View>
      ) : null}

      {!isLoading && !errorMessage ? (
        <>
          <View style={styles.metaCard} lightColor="#f8fafc" darkColor="#0f172a">
            <MetaRow label="Organization" value={activeOrganization?.name ?? "-"} />
            <MetaRow label="Business Type" value={businessTypeLabel} />
            <MetaRow label="Source" value="Backend /api/businesses/:id/navigation" />
          </View>
          <ModulesSection title="Vertical Modules" items={verticalModules} emptyText="Vertical module belum tersedia." />
          <ModulesSection title="Base Modules" items={baseModules} emptyText="Base module belum tersedia." />
        </>
      ) : null}

      <View style={styles.actions}>
        {primaryModule ? (
          <Pressable
            style={styles.primaryButton}
            onPress={() => router.replace(`/vertical/${businessType}/${primaryModule.id}` as any)}
          >
            <Text style={styles.primaryButtonText}>Buka Module Utama</Text>
          </Pressable>
        ) : null}
        <Pressable style={styles.primaryButton} onPress={loadData} disabled={isLoading}>
          <Text style={styles.primaryButtonText}>{isLoading ? "Memuat..." : "Refresh Vertical"}</Text>
        </Pressable>
        <Pressable style={styles.secondaryButton} onPress={() => router.replace("/")}>
          <Text style={styles.secondaryButtonText}>Kembali Ke Gate</Text>
        </Pressable>
      </View>
    </ScrollView>
  );
}

function MetaRow({ label, value }: { label: string; value: string }) {
  return (
    <View style={styles.metaRow}>
      <Text style={styles.metaLabel}>{label}</Text>
      <Text style={styles.metaValue}>{value}</Text>
    </View>
  );
}

function ModulesSection({
  title,
  items,
  emptyText,
}: {
  title: string;
  items: BusinessNavItem[];
  emptyText: string;
}) {
  return (
    <View style={styles.section}>
      <Text style={styles.sectionTitle}>{title}</Text>
      {items.length === 0 ? (
        <Text style={styles.emptyText}>{emptyText}</Text>
      ) : (
        items.map((item) => (
          <View key={item.id} style={styles.moduleCard} lightColor="#f1f5f9" darkColor="#1e293b">
            <Text style={styles.moduleLabel}>{item.label}</Text>
            <Text style={styles.modulePath}>{item.path}</Text>
          </View>
        ))
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  content: {
    paddingHorizontal: 16,
    paddingVertical: 20,
    gap: 14,
  },
  title: {
    fontSize: 24,
    fontWeight: "700",
  },
  subtitle: {
    fontSize: 14,
    lineHeight: 20,
    opacity: 0.8,
  },
  centerState: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
  },
  stateText: {
    fontSize: 13,
    opacity: 0.8,
  },
  errorBox: {
    borderRadius: 12,
    borderWidth: 1,
    borderColor: "#fca5a5",
    padding: 12,
  },
  errorText: {
    fontSize: 13,
    lineHeight: 19,
  },
  metaCard: {
    borderRadius: 12,
    borderWidth: 1,
    borderColor: "#cbd5e1",
    padding: 14,
    gap: 10,
  },
  metaRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    gap: 12,
  },
  metaLabel: {
    fontSize: 13,
    opacity: 0.7,
  },
  metaValue: {
    fontSize: 13,
    fontWeight: "600",
    maxWidth: "62%",
    textAlign: "right",
  },
  section: {
    gap: 8,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: "700",
  },
  moduleCard: {
    borderRadius: 10,
    borderWidth: 1,
    borderColor: "#cbd5e1",
    paddingVertical: 10,
    paddingHorizontal: 12,
    gap: 3,
  },
  moduleLabel: {
    fontSize: 14,
    fontWeight: "600",
  },
  modulePath: {
    fontSize: 12,
    opacity: 0.7,
  },
  emptyText: {
    fontSize: 13,
    opacity: 0.7,
  },
  actions: {
    gap: 10,
    marginTop: 6,
  },
  primaryButton: {
    borderRadius: 10,
    paddingVertical: 12,
    alignItems: "center",
    backgroundColor: "#0f172a",
  },
  primaryButtonText: {
    color: "#ffffff",
    fontSize: 14,
    fontWeight: "600",
  },
  secondaryButton: {
    borderRadius: 10,
    paddingVertical: 12,
    alignItems: "center",
    borderWidth: 1,
    borderColor: "#94a3b8",
  },
  secondaryButtonText: {
    fontSize: 14,
    fontWeight: "600",
  },
});
