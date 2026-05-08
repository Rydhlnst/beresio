import { useCallback, useEffect, useMemo, useState } from "react";
import { ActivityIndicator, Pressable, ScrollView, StyleSheet } from "react-native";
import { useLocalSearchParams, useRouter } from "expo-router";

import { Text, View } from "@/components/Themed";
import { authClient, useSession } from "@/lib/auth-client";
import {
  fetchBusinessNavigation,
  isBusinessType,
  normalizeBusinessType,
  pickActiveOrganization,
  type BusinessNavItem,
  type BusinessNavResponse,
  type OrganizationSummary,
} from "@/lib/business-navigation";
import { getModulePreset } from "@/lib/module-presets";

const BUSINESS_TYPE_LABEL: Record<string, string> = {
  laundry: "Laundry",
  fnb: "F&B",
  retail: "Retail",
};

export default function VerticalModuleScreen() {
  const router = useRouter();
  const { businessType: businessTypeParam, moduleId } = useLocalSearchParams<{
    businessType?: string;
    moduleId?: string;
  }>();
  const { data: session } = useSession();

  const requestedBusinessType = useMemo(
    () => normalizeBusinessType(isBusinessType(businessTypeParam) ? businessTypeParam : "retail"),
    [businessTypeParam]
  );

  const requestedModuleId = typeof moduleId === "string" ? moduleId : "";

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
        error instanceof Error ? error.message : "Terjadi error saat memuat module vertical."
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
  const allModules = useMemo(() => {
    const base = navigationData?.navigationBase ?? [];
    const vertical = navigationData?.navigationVertical ?? [];
    return [...vertical, ...base];
  }, [navigationData?.navigationBase, navigationData?.navigationVertical]);

  const currentModule = allModules.find((module) => module.id === requestedModuleId) ?? null;
  const modulePreset = getModulePreset({
    businessType,
    moduleId: requestedModuleId,
    moduleLabel: currentModule?.label,
  });

  return (
    <ScrollView contentContainerStyle={styles.content}>
      <Text style={styles.title}>{businessTypeLabel} Module</Text>
      <Text style={styles.subtitle}>Auto-redirect sekarang langsung masuk ke module utama vertical.</Text>

      {isLoading ? (
        <View style={styles.centerState}>
          <ActivityIndicator size="small" />
          <Text style={styles.stateText}>Memuat module...</Text>
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
            <MetaRow label="Module Aktif" value={currentModule?.label ?? (requestedModuleId || "-")} />
            <MetaRow label="Path Backend" value={currentModule?.path ?? "-"} />
          </View>

          <View style={styles.workspaceCard} lightColor="#ecfeff" darkColor="#083344">
            <Text style={styles.workspaceTitle}>{modulePreset.title}</Text>
            <Text style={styles.workspaceSummary}>{modulePreset.summary}</Text>
            <View style={styles.checklistWrap}>
              {modulePreset.checklist.map((item) => (
                <Text key={item} style={styles.checklistItem}>- {item}</Text>
              ))}
            </View>
            <View style={styles.workspaceActions}>
              <Pressable
                style={styles.workspacePrimaryButton}
                onPress={() => router.push(`/vertical/${businessType}/${requestedModuleId}/flow/primary` as any)}
              >
                <Text style={styles.workspacePrimaryButtonText}>{modulePreset.primaryActionLabel}</Text>
              </Pressable>
              {modulePreset.secondaryActionLabel ? (
                <Pressable
                  style={styles.workspaceSecondaryButton}
                  onPress={() => router.push(`/vertical/${businessType}/${requestedModuleId}/flow/secondary` as any)}
                >
                  <Text style={styles.workspaceSecondaryButtonText}>{modulePreset.secondaryActionLabel}</Text>
                </Pressable>
              ) : null}
            </View>
          </View>

          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Daftar Module</Text>
            {allModules.map((module) => {
              const isActive = module.id === currentModule?.id;
              return (
                <Pressable
                  key={module.id}
                  style={[styles.moduleCard, isActive && styles.moduleCardActive]}
                  onPress={() => router.replace(`/vertical/${businessType}/${module.id}` as any)}
                >
                  <Text style={styles.moduleLabel}>{module.label}</Text>
                  <Text style={styles.modulePath}>{module.path}</Text>
                </Pressable>
              );
            })}
          </View>
        </>
      ) : null}

      <View style={styles.actions}>
        <Pressable style={styles.primaryButton} onPress={loadData} disabled={isLoading}>
          <Text style={styles.primaryButtonText}>{isLoading ? "Memuat..." : "Refresh Module"}</Text>
        </Pressable>
        <Pressable style={styles.secondaryButton} onPress={() => router.replace(`/vertical/${businessType}` as any)}>
          <Text style={styles.secondaryButtonText}>Kembali Ke Vertical</Text>
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
  workspaceCard: {
    borderRadius: 12,
    borderWidth: 1,
    borderColor: "#67e8f9",
    padding: 14,
    gap: 10,
  },
  workspaceTitle: {
    fontSize: 17,
    fontWeight: "700",
  },
  workspaceSummary: {
    fontSize: 13,
    lineHeight: 18,
    opacity: 0.85,
  },
  checklistWrap: {
    gap: 4,
  },
  checklistItem: {
    fontSize: 13,
    lineHeight: 18,
  },
  workspaceActions: {
    gap: 8,
  },
  workspacePrimaryButton: {
    borderRadius: 8,
    paddingVertical: 10,
    alignItems: "center",
    backgroundColor: "#0e7490",
  },
  workspacePrimaryButtonText: {
    color: "#ffffff",
    fontSize: 13,
    fontWeight: "700",
  },
  workspaceSecondaryButton: {
    borderRadius: 8,
    paddingVertical: 10,
    alignItems: "center",
    borderWidth: 1,
    borderColor: "#0e7490",
  },
  workspaceSecondaryButtonText: {
    fontSize: 13,
    fontWeight: "600",
    color: "#0e7490",
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
    backgroundColor: "#f1f5f9",
  },
  moduleCardActive: {
    borderColor: "#0f172a",
    borderWidth: 2,
  },
  moduleLabel: {
    fontSize: 14,
    fontWeight: "600",
  },
  modulePath: {
    fontSize: 12,
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
