"use server";

import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { apiClient } from "@/lib/api-client";

function buildDescription(description: string | null, category: string | null) {
    const trimmedDesc = description?.trim() ?? "";
    const trimmedCategory = category?.trim() ?? "";
    if (!trimmedCategory) return trimmedDesc || null;
    if (!trimmedDesc) return `Kategori: ${trimmedCategory}`;
    return `${trimmedCategory} — ${trimmedDesc}`;
}

export async function createHighlightAction(formData: FormData) {
    const title = String(formData.get("title") ?? "").trim();
    const description = String(formData.get("description") ?? "").trim();
    const category = String(formData.get("category") ?? "").trim();

    if (!title) {
        throw new Error("Judul highlight wajib diisi.");
    }

    const cookie = cookies().toString();
    const res = await apiClient.api.dashboard.highlights.$post(
        { json: { title, description: buildDescription(description, category) } },
        { headers: { cookie } }
    );

    if (!res.ok) {
        const message = await res.text();
        throw new Error(message || "Gagal membuat highlight.");
    }

    redirect("/dashboard/highlights");
}

export async function archiveHighlightAction(highlightId: string, _formData: FormData) {
    const cookie = cookies().toString();
    const res = await apiClient.api.dashboard.highlights[":id"].$delete(
        { param: { id: highlightId } },
        { headers: { cookie } }
    );

    if (!res.ok) {
        const message = await res.text();
        throw new Error(message || "Gagal mengarsipkan highlight.");
    }

    redirect("/dashboard/highlights");
}
