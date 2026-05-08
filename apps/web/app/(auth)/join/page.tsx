import { auth } from "@/lib/auth";
import { createDbNextjs } from "@beresio/db";
import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { JoinForm } from "./_components/join-form";

export const metadata = {
    title: "Bergabung",
    description: "Bergabung ke bisnis menggunakan kode undangan",
};

export default async function JoinPage({
    searchParams,
}: {
    searchParams: Promise<{ token?: string }>;
}) {
    const db = createDbNextjs(process.env.DATABASE_URL!);
    const authInstance = auth(db);

    const session = await authInstance.api.getSession({
        headers: await headers(),
    });

    if (!session) {
        redirect("/login");
    }

    const { token } = await searchParams;

    return (
        <div className="w-full">
            <JoinForm initialToken={token} />
        </div>
    );
}
