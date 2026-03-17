import { redirect } from "next/navigation";
import { ResetPasswordForm } from "./_components/reset-password-form";

export const metadata = {
    title: "Reset Password | Beres",
    description: "Buat password baru untuk akun Beres kamu",
};

export default async function ResetPasswordPage({
    searchParams,
}: {
    searchParams: Promise<{ token?: string }>;
}) {
    const { token } = await searchParams;

    if (!token) {
        redirect("/forgot-password");
    }

    return (
        <div className="w-full py-4 pb-12">
            <ResetPasswordForm token={token} />
        </div>
    );
}
