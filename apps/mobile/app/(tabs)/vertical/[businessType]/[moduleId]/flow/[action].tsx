import { useCallback, useEffect, useMemo, useState } from "react";
import { ActivityIndicator, Pressable, ScrollView, StyleSheet, TextInput } from "react-native";
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
import { getModuleFlowSpec, type FlowActionType } from "@/lib/module-presets";
import { fetchModuleLiveSnapshot, type ModuleLiveSnapshot } from "@/lib/module-live-snapshot";
import {
  LAUNDRY_STATUS_OPTIONS,
  assignLaundryOrderDriver,
  fetchLaundryDrivers,
  fetchRecentLaundryOrders,
  recordLaundryPayment,
  updateLaundryOrderStatus,
  type LaundryDriverOption,
  type LaundryOrderStatus,
  type LaundryOrderSummary,
} from "@/lib/laundry-flow-actions";

function normalizeActionType(input: string | undefined): FlowActionType {
  return input === "secondary" ? "secondary" : "primary";
}

function formatCurrency(value: number) {
  return `Rp ${new Intl.NumberFormat("id-ID").format(value)}`;
}

export default function ModuleFlowScreen() {
  const router = useRouter();
  const { data: session } = useSession();
  const {
    businessType: businessTypeParam,
    moduleId: moduleIdParam,
    action: actionParam,
  } = useLocalSearchParams<{
    businessType?: string;
    moduleId?: string;
    action?: string;
  }>();

  const businessType = useMemo(
    () => normalizeBusinessType(isBusinessType(businessTypeParam) ? businessTypeParam : "retail"),
    [businessTypeParam]
  );
  const moduleId = typeof moduleIdParam === "string" ? moduleIdParam : "";
  const actionType = normalizeActionType(typeof actionParam === "string" ? actionParam : undefined);

  const [isLoading, setIsLoading] = useState(true);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [activeOrganization, setActiveOrganization] = useState<OrganizationSummary | null>(null);
  const [navigationData, setNavigationData] = useState<BusinessNavResponse | null>(null);
  const [snapshot, setSnapshot] = useState<ModuleLiveSnapshot | null>(null);
  const [snapshotError, setSnapshotError] = useState<string | null>(null);
  const [recentOrders, setRecentOrders] = useState<LaundryOrderSummary[]>([]);
  const [driverOptions, setDriverOptions] = useState<LaundryDriverOption[]>([]);
  const [isDriverDropdownOpen, setIsDriverDropdownOpen] = useState(false);
  const [orderIdInput, setOrderIdInput] = useState("");
  const [statusInput, setStatusInput] = useState<LaundryOrderStatus>("processing");
  const [statusNoteInput, setStatusNoteInput] = useState("");
  const [paymentAmountInput, setPaymentAmountInput] = useState("");
  const [paymentMethodInput, setPaymentMethodInput] = useState("cash");
  const [paymentNoteInput, setPaymentNoteInput] = useState("");
  const [driverIdInput, setDriverIdInput] = useState("");
  const [actionError, setActionError] = useState<string | null>(null);
  const [actionSuccess, setActionSuccess] = useState<string | null>(null);
  const [isActionLoading, setIsActionLoading] = useState(false);

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
        setSnapshot(null);
        return;
      }

      setNavigationData(navResponse.data);
      try {
        const snapshotData = await fetchModuleLiveSnapshot({
          businessType,
          moduleId,
        });
        setSnapshot(snapshotData);
        setSnapshotError(null);
      } catch (snapshotErr) {
        setSnapshot(null);
        setSnapshotError(
          snapshotErr instanceof Error
            ? snapshotErr.message
            : "Live snapshot belum tersedia."
        );
      }

      if (businessType === "laundry" && (moduleId === "order" || moduleId === "pickup")) {
        try {
          const latestOrders = await fetchRecentLaundryOrders(
            5,
            moduleId === "pickup" ? "pickup" : undefined
          );
          setRecentOrders(latestOrders);
          if (latestOrders.length > 0) {
            setOrderIdInput((current) => current || latestOrders[0]!.id);
            setPaymentAmountInput((current) =>
              current || String(Math.max(1000, Math.round((latestOrders[0]!.remainingAmount || 0) / 2)))
            );
          } else {
            setRecentOrders([]);
          }
        } catch {
          setRecentOrders([]);
        }
      } else {
        setRecentOrders([]);
      }

      if (businessType === "laundry" && moduleId === "pickup") {
        try {
          const drivers = await fetchLaundryDrivers();
          setDriverOptions(drivers);
        } catch {
          setDriverOptions([]);
        }
      } else {
        setDriverOptions([]);
        setIsDriverDropdownOpen(false);
      }
    } catch (error) {
      setNavigationData(null);
      setSnapshot(null);
      setErrorMessage(
        error instanceof Error ? error.message : "Terjadi error saat memuat flow module."
      );
    } finally {
      setIsLoading(false);
    }
  }, [businessType, moduleId, session]);

  useEffect(() => {
    void loadData();
  }, [loadData]);

  const allModules = useMemo(() => {
    const base = navigationData?.navigationBase ?? [];
    const vertical = navigationData?.navigationVertical ?? [];
    return [...vertical, ...base];
  }, [navigationData?.navigationBase, navigationData?.navigationVertical]);

  const activeModule: BusinessNavItem | null =
    allModules.find((item) => item.id === moduleId) ?? null;

  const flowSpec = getModuleFlowSpec({
    businessType,
    moduleId,
    moduleLabel: activeModule?.label,
    actionType,
  });

  const canExecuteLaundryOrderAction =
    businessType === "laundry" && (moduleId === "order" || moduleId === "pickup");

  const selectedDriver = useMemo(
    () => driverOptions.find((driver) => driver.id === driverIdInput) ?? null,
    [driverIdInput, driverOptions]
  );

  const laundryActionKind = useMemo<"status" | "payment" | "assign-driver" | null>(() => {
    if (!canExecuteLaundryOrderAction) return null;
    if (moduleId === "order" && actionType === "secondary") return "payment";
    if (moduleId === "pickup" && actionType === "secondary") return "assign-driver";
    return "status";
  }, [actionType, canExecuteLaundryOrderAction, moduleId]);

  const handleExecuteAction = useCallback(async () => {
    if (!canExecuteLaundryOrderAction) return;

    const orderId = orderIdInput.trim();
    if (!orderId) {
      setActionError("Order ID wajib diisi.");
      setActionSuccess(null);
      return;
    }

    setIsActionLoading(true);
    setActionError(null);
    setActionSuccess(null);

    try {
      if (laundryActionKind === "status") {
        const updated = await updateLaundryOrderStatus({
          orderId,
          status: statusInput,
          note: statusNoteInput,
        });
        setActionSuccess(
          `Status order ${String(updated.orderNumber ?? orderId)} berhasil diubah ke ${String(
            updated.status ?? statusInput
          )}.`
        );
      } else if (laundryActionKind === "payment") {
        const amount = Number(paymentAmountInput);
        const paymentResult = await recordLaundryPayment({
          orderId,
          amount,
          paymentMethod: paymentMethodInput,
          note: paymentNoteInput,
        });
        setActionSuccess(
          `Pembayaran tercatat. Sisa tagihan: ${formatCurrency(
            Number(paymentResult.order.remainingAmount ?? 0)
          )}.`
        );
      } else if (laundryActionKind === "assign-driver") {
        const updated = await assignLaundryOrderDriver({
          orderId,
          driverId: driverIdInput.trim() || null,
        });
        const assignedDriverId = String(updated.assignedDriverId ?? "");
        const assignedDriverName = String(updated.assignedDriverName ?? "").trim();
        setActionSuccess(
          assignedDriverId
            ? `Driver ${assignedDriverName || assignedDriverId} berhasil di-assign ke order ${String(
                updated.orderNumber ?? orderId
              )}.`
            : `Assignment driver untuk order ${String(updated.orderNumber ?? orderId)} berhasil di-reset.`
        );
        setIsDriverDropdownOpen(false);
      }
      await loadData();
    } catch (error) {
      setActionError(error instanceof Error ? error.message : "Gagal mengeksekusi aksi.");
    } finally {
      setIsActionLoading(false);
    }
  }, [
    actionType,
    canExecuteLaundryOrderAction,
    loadData,
    laundryActionKind,
    orderIdInput,
    driverIdInput,
    paymentAmountInput,
    paymentMethodInput,
    paymentNoteInput,
    statusInput,
    statusNoteInput,
  ]);

  return (
    <ScrollView contentContainerStyle={styles.content}>
      <Text style={styles.title}>{flowSpec.title}</Text>
      <Text style={styles.subtitle}>{flowSpec.description}</Text>

      {isLoading ? (
        <View style={styles.centerState}>
          <ActivityIndicator size="small" />
          <Text style={styles.stateText}>Menyiapkan flow...</Text>
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
            <MetaRow label="Business Type" value={businessType} />
            <MetaRow label="Module" value={activeModule?.label ?? (moduleId || "-")} />
            <MetaRow label="Path Backend" value={activeModule?.path ?? "-"} />
          </View>

          <View style={styles.stepsCard} lightColor="#ecfeff" darkColor="#083344">
            <Text style={styles.stepsTitle}>Execution Steps</Text>
            {flowSpec.steps.map((step, index) => (
              <Text key={`${step}-${index}`} style={styles.stepItem}>
                {index + 1}. {step}
              </Text>
            ))}
            <View style={styles.metricBox} lightColor="#cffafe" darkColor="#155e75">
              <Text style={styles.metricLabel}>Success Metric</Text>
              <Text style={styles.metricValue}>{flowSpec.successMetric}</Text>
            </View>
          </View>

          {canExecuteLaundryOrderAction ? (
            <View style={styles.executionCard} lightColor="#f8fafc" darkColor="#0b1220">
              <Text style={styles.executionTitle}>Eksekusi Aksi Laundry</Text>
              <Text style={styles.executionHint}>
                Action ini langsung memanggil endpoint backend sesuai flow: status update atau record payment.
              </Text>

              <Text style={styles.inputLabel}>Pilih Order (5 terbaru)</Text>
              <View style={styles.quickOrderWrap}>
                {recentOrders.length > 0 ? (
                  recentOrders.map((order) => (
                    <Pressable
                      key={order.id}
                      style={[
                        styles.quickOrderChip,
                        orderIdInput === order.id && styles.quickOrderChipActive,
                      ]}
                      onPress={() => {
                        setOrderIdInput(order.id);
                        if (laundryActionKind === "payment") {
                          setPaymentAmountInput((current) =>
                            current || String(Math.max(1000, Math.round(order.remainingAmount / 2)))
                          );
                        }
                        if (laundryActionKind === "assign-driver") {
                          setDriverIdInput(order.assignedDriverId ?? "");
                        }
                      }}
                    >
                      <Text style={styles.quickOrderChipText}>
                        {order.orderNumber} | {order.status} | {formatCurrency(order.remainingAmount)}
                      </Text>
                    </Pressable>
                  ))
                ) : (
                  <Text style={styles.executionHint}>Belum ada order terbaru untuk dipilih.</Text>
                )}
              </View>

              <Text style={styles.inputLabel}>Order ID</Text>
              <TextInput
                value={orderIdInput}
                onChangeText={setOrderIdInput}
                placeholder="Contoh: ord-123"
                style={styles.input}
                autoCapitalize="none"
              />

              {laundryActionKind === "status" ? (
                <>
                  <Text style={styles.inputLabel}>Status Tujuan</Text>
                  <View style={styles.statusWrap}>
                    {LAUNDRY_STATUS_OPTIONS.map((statusOption) => (
                      <Pressable
                        key={statusOption}
                        style={[
                          styles.statusChip,
                          statusInput === statusOption && styles.statusChipActive,
                        ]}
                        onPress={() => setStatusInput(statusOption)}
                      >
                        <Text style={styles.statusChipText}>{statusOption}</Text>
                      </Pressable>
                    ))}
                  </View>
                  <Text style={styles.inputLabel}>Catatan Status (opsional)</Text>
                  <TextInput
                    value={statusNoteInput}
                    onChangeText={setStatusNoteInput}
                    placeholder="Contoh: Selesai dicuci, siap diambil"
                    style={styles.input}
                  />
                </>
              ) : null}

              {laundryActionKind === "payment" ? (
                <>
                  <Text style={styles.inputLabel}>Nominal Pembayaran</Text>
                  <TextInput
                    value={paymentAmountInput}
                    onChangeText={setPaymentAmountInput}
                    placeholder="Contoh: 5000"
                    style={styles.input}
                    keyboardType="numeric"
                  />
                  <Text style={styles.inputLabel}>Metode Pembayaran</Text>
                  <TextInput
                    value={paymentMethodInput}
                    onChangeText={setPaymentMethodInput}
                    placeholder="cash / transfer / qris"
                    style={styles.input}
                    autoCapitalize="none"
                  />
                  <Text style={styles.inputLabel}>Catatan Pembayaran (opsional)</Text>
                  <TextInput
                    value={paymentNoteInput}
                    onChangeText={setPaymentNoteInput}
                    placeholder="Contoh: DP customer"
                    style={styles.input}
                  />
                </>
              ) : null}

              {laundryActionKind === "assign-driver" ? (
                <>
                  <Text style={styles.inputLabel}>Driver</Text>
                  <Pressable
                    style={styles.dropdownTrigger}
                    onPress={() => setIsDriverDropdownOpen((prev) => !prev)}
                  >
                    <Text style={styles.dropdownTriggerText}>
                      {driverIdInput
                        ? selectedDriver
                          ? `${selectedDriver.name} (${selectedDriver.id})`
                          : `Driver ID: ${driverIdInput}`
                        : "Tanpa Driver (Unassign)"}
                    </Text>
                  </Pressable>
                  {isDriverDropdownOpen ? (
                    <View style={styles.dropdownList}>
                      <Pressable
                        style={styles.dropdownOption}
                        onPress={() => {
                          setDriverIdInput("");
                          setIsDriverDropdownOpen(false);
                        }}
                      >
                        <Text style={styles.dropdownOptionText}>Tanpa Driver (Unassign)</Text>
                      </Pressable>
                      {driverOptions.length === 0 ? (
                        <Text style={styles.executionHint}>Belum ada driver aktif terdaftar.</Text>
                      ) : (
                        driverOptions.map((driver) => (
                          <Pressable
                            key={driver.id}
                            style={styles.dropdownOption}
                            onPress={() => {
                              setDriverIdInput(driver.id);
                              setIsDriverDropdownOpen(false);
                            }}
                          >
                            <Text style={styles.dropdownOptionText}>
                              {driver.name} ({driver.id})
                            </Text>
                          </Pressable>
                        ))
                      )}
                    </View>
                  ) : null}
                  <Text style={styles.executionHint}>
                    Pilih driver aktif dari team member. Opsi tanpa driver akan me-reset assignment.
                  </Text>
                </>
              ) : null}

              {actionError ? <Text style={styles.actionError}>{actionError}</Text> : null}
              {actionSuccess ? <Text style={styles.actionSuccess}>{actionSuccess}</Text> : null}

              <Pressable
                style={[styles.executeButton, isActionLoading && styles.executeButtonDisabled]}
                onPress={handleExecuteAction}
                disabled={isActionLoading}
              >
                <Text style={styles.executeButtonText}>
                  {isActionLoading
                    ? "Memproses..."
                    : laundryActionKind === "status"
                    ? "Jalankan Status Update"
                    : laundryActionKind === "payment"
                    ? "Jalankan Record Payment"
                    : "Jalankan Assign Driver"}
                </Text>
              </Pressable>
            </View>
          ) : null}

          <View style={styles.snapshotCard} lightColor="#f8fafc" darkColor="#111827">
            <Text style={styles.snapshotTitle}>Live Snapshot</Text>
            <Text style={styles.snapshotEndpoint}>
              {snapshot ? snapshot.endpoint : "Snapshot endpoint belum tersedia"}
            </Text>
            {snapshot ? (
              <>
                {snapshot.rows.map((row) => (
                  <View key={`${row.label}-${row.value}`} style={styles.snapshotRow}>
                    <Text style={styles.snapshotLabel}>{row.label}</Text>
                    <Text style={styles.snapshotValue}>{row.value}</Text>
                  </View>
                ))}
                <Text style={styles.snapshotFetchedAt}>Fetched: {snapshot.fetchedAt}</Text>
              </>
            ) : snapshotError ? (
              <Text style={styles.snapshotErrorText}>Snapshot error: {snapshotError}</Text>
            ) : (
              <Text style={styles.snapshotErrorText}>Snapshot belum siap.</Text>
            )}
          </View>
        </>
      ) : null}

      <View style={styles.actions}>
        <Pressable style={styles.primaryButton} onPress={loadData} disabled={isLoading}>
          <Text style={styles.primaryButtonText}>{isLoading ? "Memuat..." : "Refresh Flow"}</Text>
        </Pressable>
        <Pressable
          style={styles.secondaryButton}
          onPress={() => router.replace(`/vertical/${businessType}/${moduleId}` as any)}
        >
          <Text style={styles.secondaryButtonText}>Kembali Ke Module</Text>
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
  stepsCard: {
    borderRadius: 12,
    borderWidth: 1,
    borderColor: "#67e8f9",
    padding: 14,
    gap: 8,
  },
  stepsTitle: {
    fontSize: 16,
    fontWeight: "700",
  },
  stepItem: {
    fontSize: 13,
    lineHeight: 18,
  },
  metricBox: {
    borderRadius: 10,
    borderWidth: 1,
    borderColor: "#67e8f9",
    padding: 10,
    gap: 4,
  },
  metricLabel: {
    fontSize: 12,
    opacity: 0.75,
  },
  metricValue: {
    fontSize: 13,
    fontWeight: "600",
    lineHeight: 18,
  },
  executionCard: {
    borderRadius: 12,
    borderWidth: 1,
    borderColor: "#cbd5e1",
    padding: 12,
    gap: 8,
  },
  executionTitle: {
    fontSize: 15,
    fontWeight: "700",
  },
  executionHint: {
    fontSize: 12,
    lineHeight: 18,
    opacity: 0.75,
  },
  quickOrderWrap: {
    gap: 6,
  },
  quickOrderChip: {
    borderWidth: 1,
    borderColor: "#cbd5e1",
    borderRadius: 8,
    paddingVertical: 7,
    paddingHorizontal: 10,
    backgroundColor: "#f8fafc",
  },
  quickOrderChipActive: {
    borderColor: "#0f172a",
    backgroundColor: "#e2e8f0",
  },
  quickOrderChipText: {
    fontSize: 12,
    fontWeight: "500",
  },
  inputLabel: {
    fontSize: 12,
    fontWeight: "600",
    opacity: 0.8,
  },
  input: {
    borderWidth: 1,
    borderColor: "#cbd5e1",
    borderRadius: 8,
    paddingHorizontal: 10,
    paddingVertical: 9,
    fontSize: 13,
  },
  dropdownTrigger: {
    borderWidth: 1,
    borderColor: "#cbd5e1",
    borderRadius: 8,
    paddingHorizontal: 10,
    paddingVertical: 10,
    backgroundColor: "#ffffff",
  },
  dropdownTriggerText: {
    fontSize: 13,
    fontWeight: "500",
  },
  dropdownList: {
    borderWidth: 1,
    borderColor: "#e2e8f0",
    borderRadius: 8,
    overflow: "hidden",
  },
  dropdownOption: {
    paddingVertical: 9,
    paddingHorizontal: 10,
    borderBottomWidth: 1,
    borderBottomColor: "#f1f5f9",
  },
  dropdownOptionText: {
    fontSize: 13,
  },
  statusWrap: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 8,
  },
  statusChip: {
    borderWidth: 1,
    borderColor: "#94a3b8",
    borderRadius: 999,
    paddingHorizontal: 10,
    paddingVertical: 6,
    backgroundColor: "#f8fafc",
  },
  statusChipActive: {
    borderColor: "#0e7490",
    backgroundColor: "#cffafe",
  },
  statusChipText: {
    fontSize: 12,
    fontWeight: "600",
  },
  executeButton: {
    borderRadius: 10,
    paddingVertical: 11,
    alignItems: "center",
    backgroundColor: "#0e7490",
    marginTop: 4,
  },
  executeButtonDisabled: {
    opacity: 0.6,
  },
  executeButtonText: {
    color: "#ffffff",
    fontSize: 13,
    fontWeight: "700",
  },
  actionError: {
    fontSize: 12,
    color: "#dc2626",
    lineHeight: 18,
  },
  actionSuccess: {
    fontSize: 12,
    color: "#047857",
    lineHeight: 18,
  },
  actions: {
    gap: 10,
    marginTop: 6,
  },
  snapshotCard: {
    borderRadius: 12,
    borderWidth: 1,
    borderColor: "#cbd5e1",
    padding: 12,
    gap: 8,
  },
  snapshotTitle: {
    fontSize: 15,
    fontWeight: "700",
  },
  snapshotEndpoint: {
    fontSize: 12,
    opacity: 0.75,
  },
  snapshotRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    gap: 12,
  },
  snapshotLabel: {
    fontSize: 13,
    opacity: 0.8,
    maxWidth: "52%",
  },
  snapshotValue: {
    fontSize: 13,
    fontWeight: "600",
    textAlign: "right",
    maxWidth: "46%",
  },
  snapshotFetchedAt: {
    fontSize: 11,
    opacity: 0.65,
  },
  snapshotErrorText: {
    fontSize: 12,
    lineHeight: 18,
    color: "#f97316",
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
