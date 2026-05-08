import { redirect } from "next/navigation";
import { headers } from "next/headers";
import { auth } from "@/lib/auth";
import { createDbNextjs } from "@beresio/db";
import { WelcomeView } from "./_components/welcome-view";

export const metadata = {
    title: "Selamat Datang",
    description: "Pilih tujuan kamu menggunakan Beres",
};

export default async function WelcomePage() {
    const db = createDbNextjs(process.env.DATABASE_URL!);
    const authInstance = auth(db);

    const session = await authInstance.api.getSession({
        headers: await headers(),
    });

    if (!session) {
        redirect("/login");
    }

    // Check if user already has an organization
    const orgData = await authInstance.api.listOrganizations({
        headers: await headers(),
    });

    const hasOrg = orgData && orgData.length > 0;

    if (hasOrg) {
        redirect("/dashboard");
    }

    return (
        <div className="w-full max-w-2xl px-4 py-12 mx-auto">
            <WelcomeView userName={session.user.name} />
        </div>
    );
}
