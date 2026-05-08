import { redirect } from "next/navigation";
import { auth } from "@/lib/auth";
import { headers } from "next/headers";
import { createDbNextjs } from "@beresio/db";
import { LoginForm } from "./_components/login-form";

export const metadata = {
    title: "Masuk",
    description: "Masuk ke akun Beres kamu",
};

export default async function LoginPage() {
    const db = createDbNextjs(process.env.DATABASE_URL!);
    const session = await auth(db).api.getSession({ headers: await headers() });

    if (session) {
        redirect("/dashboard");
    }

    return (
        <div className="w-full py-4 pb-12">
            <LoginForm />
        </div>
    );
}
