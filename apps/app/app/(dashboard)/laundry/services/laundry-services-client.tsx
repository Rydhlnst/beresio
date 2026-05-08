"use client";

import { useMemo, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@repo/ui/button";
import { Input } from "@repo/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@repo/ui/select";
import { createLaundryServiceAction, updateLaundryServiceAction } from "../_actions";

type Branch = { id: string; name: string };
type Service = {
    id: string;
    branchId: string;
    name: string;
    unit: string;
    basePrice: number;
    estimatedDurationHours: number;
    isActive: boolean;
};

type LaundryServicesClientProps = {
    branches: Branch[] | { data?: Branch[] };
    services: Service[] | { data?: Service[] };
};

export default function LaundryServicesClient({ branches, services }: LaundryServicesClientProps) {
    const normalizedBranches = Array.isArray(branches) ? branches : branches?.data ?? [];
    const normalizedServices = Array.isArray(services) ? services : services?.data ?? [];
    const router = useRouter();
    const [isPending, startTransition] = useTransition();
    const [branchId, setBranchId] = useState(normalizedBranches[0]?.id ?? "");
    const [name, setName] = useState("");
    const [unit, setUnit] = useState("kg");
    const [basePrice, setBasePrice] = useState(0);
    const [estimatedDurationHours, setEstimatedDurationHours] = useState(24);
    const [error, setError] = useState<string | null>(null);
    const [success, setSuccess] = useState<string | null>(null);

    const groupedServices = useMemo(() => {
        return normalizedServices
            .slice()
            .sort((a, b) => a.name.localeCompare(b.name))
            .map((service) => ({
                ...service,
                branchName: normalizedBranches.find((branch) => branch.id === service.branchId)?.name ?? service.branchId,
            }));
    }, [normalizedBranches, normalizedServices]);

    const onCreate = () => {
        setError(null);
        setSuccess(null);
        if (!branchId || !name.trim()) {
            setError("Cabang dan nama layanan wajib diisi.");
            return;
        }

        startTransition(async () => {
            const result = await createLaundryServiceAction({
                branchId,
                name: name.trim(),
                unit: unit.trim() || "kg",
                basePrice,
                estimatedDurationHours,
                isActive: true,
            });
            if (!result.ok) {
                setError(result.error ?? "Gagal membuat layanan.");
                return;
            }
            setSuccess("Layanan berhasil ditambahkan.");
            setName("");
            setBasePrice(0);
            setEstimatedDurationHours(24);
            router.refresh();
        });
    };

    const onToggleActive = (service: Service) => {
        setError(null);
        setSuccess(null);
        startTransition(async () => {
            const result = await updateLaundryServiceAction({
                id: service.id,
                isActive: !service.isActive,
            });
            if (!result.ok) {
                setError(result.error ?? "Gagal memperbarui layanan.");
                return;
            }
            setSuccess(`Layanan ${service.name} berhasil diperbarui.`);
            router.refresh();
        });
    };

    return (
        <div className="space-y-6">
            <div className="rounded-xl border bg-card p-4">
                <h2 className="text-sm font-semibold">Tambah Layanan Laundry</h2>
                <div className="mt-4 grid gap-3 md:grid-cols-2 xl:grid-cols-5">
                    <Select value={branchId} onValueChange={setBranchId} disabled={isPending || normalizedBranches.length === 0}>
                        <SelectTrigger className="h-10">
                            <SelectValue placeholder="Pilih cabang" />
                        </SelectTrigger>
                        <SelectContent>
                            {normalizedBranches.map((branch) => (
                                <SelectItem key={branch.id} value={branch.id}>
                                    {branch.name}
                                </SelectItem>
                            ))}
                        </SelectContent>
                    </Select>
                    <Input
                        type="text"
                        value={name}
                        onChange={(event) => setName(event.target.value)}
                        placeholder="Nama layanan"
                        className="h-10"
                        disabled={isPending}
                    />
                    <Input
                        type="text"
                        value={unit}
                        onChange={(event) => setUnit(event.target.value)}
                        placeholder="Unit (kg/pcs)"
                        className="h-10"
                        disabled={isPending}
                    />
                    <Input
                        type="number"
                        min={0}
                        value={basePrice}
                        onChange={(event) => setBasePrice(Number(event.target.value || 0))}
                        placeholder="Harga dasar"
                        className="h-10"
                        disabled={isPending}
                    />
                    <Input
                        type="number"
                        min={0}
                        value={estimatedDurationHours}
                        onChange={(event) => setEstimatedDurationHours(Number(event.target.value || 0))}
                        placeholder="Estimasi (jam)"
                        className="h-10"
                        disabled={isPending}
                    />
                </div>
                <Button className="mt-3 h-10 text-sm font-semibold" onClick={onCreate} disabled={isPending || normalizedBranches.length === 0}>
                    Simpan Layanan
                </Button>
            </div>

            <div className="overflow-x-auto rounded-xl border">
                <table className="min-w-full text-sm">
                    <thead className="bg-muted/40">
                        <tr>
                            <th className="px-4 py-3 text-left font-semibold">Nama Layanan</th>
                            <th className="px-4 py-3 text-left font-semibold">Cabang</th>
                            <th className="px-4 py-3 text-left font-semibold">Harga Dasar</th>
                            <th className="px-4 py-3 text-left font-semibold">Estimasi</th>
                            <th className="px-4 py-3 text-left font-semibold">Status</th>
                            <th className="px-4 py-3 text-left font-semibold">Aksi</th>
                        </tr>
                    </thead>
                    <tbody>
                        {groupedServices.length === 0 ? (
                            <tr>
                                <td className="px-4 py-8 text-center text-muted-foreground" colSpan={6}>
                                    Belum ada layanan laundry.
                                </td>
                            </tr>
                        ) : (
                            groupedServices.map((service) => (
                                <tr key={service.id} className="border-t">
                                    <td className="px-4 py-3">
                                        <p className="font-semibold">{service.name}</p>
                                        <p className="text-xs text-muted-foreground">/ {service.unit}</p>
                                    </td>
                                    <td className="px-4 py-3">{service.branchName}</td>
                                    <td className="px-4 py-3">Rp {service.basePrice.toLocaleString("id-ID")}</td>
                                    <td className="px-4 py-3">{service.estimatedDurationHours} jam</td>
                                    <td className="px-4 py-3">{service.isActive ? "Active" : "Inactive"}</td>
                                    <td className="px-4 py-3">
                                        <Button
                                            variant="outline"
                                            className="h-8 text-xs font-semibold"
                                            onClick={() => onToggleActive(service)}
                                            disabled={isPending}
                                        >
                                            {service.isActive ? "Nonaktifkan" : "Aktifkan"}
                                        </Button>
                                    </td>
                                </tr>
                            ))
                        )}
                    </tbody>
                </table>
            </div>

            {error ? <p className="text-sm font-medium text-red-600">{error}</p> : null}
            {success ? <p className="text-sm font-medium text-emerald-600">{success}</p> : null}
        </div>
    );
}
