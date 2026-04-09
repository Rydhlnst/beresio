import type { Metadata } from "next";
import { LoginForm as LoginFormAlias } from "../_components/LoginForm";

export const metadata: Metadata = {
    title: "Masuk",
    description: "Masuk ke akun Beres kamu",
};

export default function SignInPage() {
    return (
        <div className="w-full py-4 pb-12">
            <LoginFormAlias />
        </div>
    );
}
