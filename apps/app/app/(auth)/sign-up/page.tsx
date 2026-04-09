import type { Metadata } from "next";
import { SignUpForm } from "../_components/SignUpForm";

export const metadata: Metadata = {
    title: "Daftar",
    description: "Buat akun baru untuk mulai menggunakan Beres",
};

export default function SignUpPage() {
    return (
        <div className="w-full py-4 pb-12">
            <SignUpForm />
        </div>
    );
}
