import { redirect } from "next/navigation";
import { auth } from "@/lib/auth";
import { headers } from "next/headers";
import { createDbNextjs } from "@beresio/db";
import { SignUpForm } from "../_components/SignUpForm";

export const metadata = {
    title: "Daftar",
    description: "Buat akun baru untuk mulai menggunakan Beres",
};

export default async function RegisterPage() {
    const db = createDbNextjs(process.env.DATABASE_URL!);
    const session = await auth(db).api.getSession({ headers: await headers() });

    if (session) {
        redirect("/dashboard");
    }

    return (
        <div className="w-full py-4 pb-12">
            <SignUpForm />
        </div>
    );
}
