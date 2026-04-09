import { Metadata } from "next";
import { redirect } from "next/navigation";
import { getActiveOrganizationContext } from "@/lib/organization-context";

export const metadata: Metadata = {
    title: "Pickup & Delivery",
    description: "Redirect kompatibilitas ke dashboard laundry orders.",
};

export default async function PickupPage() {
    const activeOrg = await getActiveOrganizationContext();
    if (!activeOrg) redirect("/login");
    if (activeOrg.businessType !== "laundry") redirect("/dashboard");
    redirect("/laundry/orders?orderType=pickup");
}
