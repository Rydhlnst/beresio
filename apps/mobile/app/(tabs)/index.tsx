import { useCallback, useEffect, useMemo, useState } from "react";
import { ActivityIndicator, Linking, Pressable, StyleSheet } from "react-native";
import { useRouter } from "expo-router";

import { Text, View } from "@/components/Themed";
import {
  fetchBusinessNavigation,
  normalizeBusinessType,
  pickPrimaryModule,
  pickActiveOrganization,
  type OrganizationSummary,
} from "@/lib/business-navigation";
import { authClient, useSession } from "@/lib/auth-client";

const BUSINESS_TYPE_LABEL: Record<string, string> = {
  laundry: "Laundry",
  fnb: "F&B",
  retail: "Retail",
};

const WEB_ONBOARDING_URL =
  process.env.EXPO_PUBLIC_APP_URL
  || process.env.EXPO_PUBLIC_WEB_URL
  || "http://localhost:3001/onboarding/org";

export default function VerticalGateScreen() {
  const router = useRouter();
  const { data: session, isPending: isSessionPending } = useSession();

  const [isLoading, setIsLoading] = useState(false);
  const [isRedirecting, setIsRedirecting] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [activeOrganization, setActiveOrganization] = useState<OrganizationSummary | null>(null);
  const [resolvedBusinessType, setResolvedBusinessType] = useState<string | null>(null);
  const [primaryModuleId, setPrimaryModuleId] = useState<string | null>(null);

  const loadGate = useCallback(async () => {
    setIsLoading(true);
    setErrorMessage(null);
    setResolvedBusinessType(null);
    setPrimaryModuleId(null);
    setActiveOrganization(null);

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

      if (!activeOrg) return;

      const navResponse = await fetchBusinessNavigation(activeOrg.id);
      if (!navResponse.data) {
        setResolvedBusinessType(normalizeBusinessType(activeOrg.businessType ?? "retail"));
        setErrorMessage(navResponse.errorMessage || "Tidak bisa mengambil data navigation dari backend.");
        return;
      }

      setResolvedBusinessType(navResponse.data.business.type);
      const primaryModule = pickPrimaryModule(navResponse.data);
      setPrimaryModuleId(primaryModule?.id ?? null);
    } catch (error) {
      setErrorMessage(error instanceof Error ? error.message : "Terjadi error saat menentukan vertical.");
    } finally {
      setIsLoading(false);
    }
  }, [session]);

  useEffect(() => {
    if (!isSessionPending) {
      void loadGate();
    }
  }, [isSessionPending, loadGate]);

  useEffect(() => {
    if (isSessionPending || isLoading || isRedirecting) return;
    if (!activeOrganization || !resolvedBusinessType) return;

    setIsRedirecting(true);
    if (primaryModuleId) {
      router.replace(`/vertical/${resolvedBusinessType}/${primaryModuleId}` as any);
      return;
    }
    router.replace(`/vertical/${resolvedBusinessType}` as any);
  }, [activeOrganization, isLoading, isRedirecting, isSessionPending, primaryModuleId, resolvedBusinessType, router]);

  const businessTypeLabel = useMemo(() => {
    if (!resolvedBusinessType) return "-";
    return BUSINESS_TYPE_LABEL[resolvedBusinessType] ?? resolvedBusinessType;
  }, [resolvedBusinessType]);

  if (isSessionPending || isLoading || isRedirecting) {
    return (
      <View style={styles.centerContainer}>
        <ActivityIndicator size="small" />
        <Text style={styles.stateTitle}>Menyiapkan Vertical...</Text>
        <Text style={styles.stateSubtitle}>
          Mengecek organization aktif dan business type dari shared backend logic.
        </Text>
      </View>
    );
  }

  if (!activeOrganization) {
    return (
      <View style={styles.centerContainer}>
        <Text style={styles.stateTitle}>Onboarding Diperlukan</Text>
        <Text style={styles.stateSubtitle}>
          Kamu belum punya organization aktif. Selesaikan onboarding dulu supaya auto redirect vertical bisa jalan.
        </Text>
        <Pressable style={styles.primaryButton} onPress={() => void Linking.openURL(WEB_ONBOARDING_URL)}>
          <Text style={styles.primaryButtonText}>Buka Onboarding</Text>
        </Pressable>
        <Pressable style={styles.secondaryButton} onPress={loadGate}>
          <Text style={styles.secondaryButtonText}>Cek Ulang</Text>
        </Pressable>
      </View>
    );
  }

  return (
    <View style={styles.centerContainer}>
      <Text style={styles.stateTitle}>Gagal Redirect Otomatis</Text>
      <Text style={styles.stateSubtitle}>
        Organization: {activeOrganization.name}{"\n"}
        Business Type: {businessTypeLabel}
      </Text>
      {errorMessage ? (
        <View style={styles.errorBox} lightColor="#fef2f2" darkColor="#450a0a">
          <Text style={styles.errorText}>{errorMessage}</Text>
        </View>
      ) : null}
      <Pressable style={styles.primaryButton} onPress={loadGate}>
        <Text style={styles.primaryButtonText}>Coba Lagi</Text>
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  centerContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    paddingHorizontal: 20,
    gap: 12,
  },
  stateTitle: {
    fontSize: 22,
    fontWeight: "700",
    textAlign: "center",
  },
  stateSubtitle: {
    fontSize: 14,
    lineHeight: 20,
    textAlign: "center",
    opacity: 0.8,
  },
  primaryButton: {
    width: "100%",
    maxWidth: 280,
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
    width: "100%",
    maxWidth: 280,
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
  errorBox: {
    width: "100%",
    maxWidth: 320,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: "#fca5a5",
    padding: 12,
  },
  errorText: {
    fontSize: 13,
    lineHeight: 18,
    textAlign: "center",
  },
});
