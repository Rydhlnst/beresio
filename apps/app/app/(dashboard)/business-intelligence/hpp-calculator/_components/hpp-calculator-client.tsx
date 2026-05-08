"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Card, CardHeader, CardTitle, CardContent, CardDescription } from "@repo/ui/card";
import { Button } from "@repo/ui/button";
import { Input } from "@repo/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@repo/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@repo/ui/table";
import { addCostItemAction, deleteCostItemAction } from "../../_actions/bi-calculations";
import { toast } from "sonner";
import { Plus, Trash2 } from "lucide-react";
import { type BiCostItem } from "@beresio/db";

type CostCategory = "chemical" | "utility" | "labor" | "fixed_cost" | "maintenance";
type UsageMetric = "per_kg" | "per_cycle" | "per_month" | "per_liter" | "per_kwh";

export function HppCalculatorClient({ initialItems }: { initialItems: BiCostItem[] }) {
    const router = useRouter();
    const [items, setItems] = useState<BiCostItem[]>(initialItems);
    const [isSubmitting, setIsSubmitting] = useState(false);

    useEffect(() => {
        setItems(initialItems);
    }, [initialItems]);

    const [formData, setFormData] = useState({
        category: "chemical" as CostCategory,
        name: "",
        usageMetric: "per_kg" as UsageMetric,
        usageAmount: "",
        pricePerUnit: ""
    });

    const handleAdd = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!formData.name || !formData.usageAmount || !formData.pricePerUnit) {
            toast.error("Please fill all fields");
            return;
        }

        setIsSubmitting(true);
        const res = await addCostItemAction({
            ...formData,
            usageAmount: parseFloat(formData.usageAmount),
            pricePerUnit: parseFloat(formData.pricePerUnit),
        });

        if (res.ok) {
            toast.success("Cost item added");
            setFormData({ ...formData, name: "", usageAmount: "", pricePerUnit: "" });
            router.refresh();
        } else {
            toast.error(res.error || "Failed to add cost item");
        }
        setIsSubmitting(false);
    };

    const handleDelete = async (id: string, name: string) => {
        toast.promise(
            deleteCostItemAction(id),
            {
                loading: `Deleting ${name}...`,
                success: () => {
                    setItems(items.filter(i => i.id !== id));
                    router.refresh();
                    return "Item deleted";
                },
                error: "Failed to delete item"
            }
        );
    };

    return (
        <div className="grid gap-6 md:grid-cols-2">
            <Card>
                <CardHeader>
                    <CardTitle>Add Cost Item</CardTitle>
                    <CardDescription>Include every minor and major expense to improve accuracy.</CardDescription>
                </CardHeader>
                <CardContent>
                    <form onSubmit={handleAdd} className="space-y-4">
                        <div className="grid grid-cols-2 gap-4">
                            <div className="space-y-2">
                                <label className="text-sm font-medium">Category</label>
                                <Select
                                    value={formData.category}
                                    onValueChange={(v) => setFormData((p) => ({ ...p, category: v as CostCategory }))}
                                >
                                    <SelectTrigger>
                                        <SelectValue />
                                    </SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="chemical">Chemical</SelectItem>
                                        <SelectItem value="utility">Utility</SelectItem>
                                        <SelectItem value="labor">Labor</SelectItem>
                                        <SelectItem value="fixed_cost">Fixed Cost</SelectItem>
                                        <SelectItem value="maintenance">Maintenance</SelectItem>
                                    </SelectContent>
                                </Select>
                            </div>
                            <div className="space-y-2">
                                <label className="text-sm font-medium">Metric Tracking</label>
                                <Select
                                    value={formData.usageMetric}
                                    onValueChange={(v) => setFormData((p) => ({ ...p, usageMetric: v as UsageMetric }))}
                                >
                                    <SelectTrigger>
                                        <SelectValue />
                                    </SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="per_kg">Per Kg</SelectItem>
                                        <SelectItem value="per_cycle">Per Cycle</SelectItem>
                                        <SelectItem value="per_month">Per Month</SelectItem>
                                        <SelectItem value="per_liter">Per Liter</SelectItem>
                                        <SelectItem value="per_kwh">Per KWh</SelectItem>
                                    </SelectContent>
                                </Select>
                            </div>
                        </div>

                        <div className="space-y-2">
                            <label className="text-sm font-medium">Item Name</label>
                            <Input placeholder="e.g. Premium Detergent" value={formData.name} onChange={e => setFormData(p => ({ ...p, name: e.target.value }))} />
                        </div>

                        <div className="grid grid-cols-2 gap-4">
                            <div className="space-y-2">
                                <label className="text-sm font-medium">Usage Amount</label>
                                <Input type="number" step="0.01" placeholder="e.g. 50" value={formData.usageAmount} onChange={e => setFormData(p => ({ ...p, usageAmount: e.target.value }))} />
                                <p className="text-xs text-muted-foreground">Amount used per metric</p>
                            </div>
                            <div className="space-y-2">
                                <label className="text-sm font-medium">Unit Price (Rp)</label>
                                <Input type="number" placeholder="e.g. 25000" value={formData.pricePerUnit} onChange={e => setFormData(p => ({ ...p, pricePerUnit: e.target.value }))} />
                                <p className="text-xs text-muted-foreground">Price per overall unit</p>
                            </div>
                        </div>

                        <Button type="submit" disabled={isSubmitting} className="w-full">
                            {isSubmitting ? "Adding..." : <><Plus className="w-4 h-4 mr-2" /> Add Item</>}
                        </Button>
                    </form>
                </CardContent>
            </Card>

            <Card>
                <CardHeader>
                    <CardTitle>Current Overhead List</CardTitle>
                    <CardDescription>Tracked variables that affect your exact HPP.</CardDescription>
                </CardHeader>
                <CardContent>
                    <div className="rounded-md border">
                        <Table>
                            <TableHeader>
                                <TableRow>
                                    <TableHead>Category</TableHead>
                                    <TableHead>Name</TableHead>
                                    <TableHead className="text-right">Cost</TableHead>
                                    <TableHead></TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {items.length === 0 ? (
                                    <TableRow>
                                        <TableCell colSpan={4} className="text-center h-24 text-muted-foreground">No items added yet</TableCell>
                                    </TableRow>
                                ) : (
                                    items.map((item) => (
                                        <TableRow key={item.id}>
                                            <TableCell className="capitalize">{item.category.replace('_', ' ')}</TableCell>
                                            <TableCell className="font-medium">{item.name}</TableCell>
                                            <TableCell className="text-right">
                                                Rp {(parseFloat(item.usageAmount) * parseFloat(item.pricePerUnit)).toLocaleString('id-ID')}
                                                <div className="text-xs text-muted-foreground">/{item.usageMetric.replace('per_', '')}</div>
                                            </TableCell>
                                            <TableCell className="w-12 text-center">
                                                <Button variant="ghost" size="icon" onClick={() => handleDelete(item.id, item.name)}>
                                                    <Trash2 className="w-4 h-4 text-destructive" />
                                                </Button>
                                            </TableCell>
                                        </TableRow>
                                    ))
                                )}
                            </TableBody>
                        </Table>
                    </div>
                </CardContent>
            </Card>
        </div>
    );
}
