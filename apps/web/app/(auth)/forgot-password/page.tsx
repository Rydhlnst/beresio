import { ForgotPasswordForm } from "./_components/forgot-password-form";

export const metadata = {
    title: "Lupa Password | Beres",
    description: "Reset password akun Beres kamu",
};

export default function ForgotPasswordPage() {
    return (
        <div className="w-full py-4 pb-12">
            <ForgotPasswordForm />
        </div>
    );
}
