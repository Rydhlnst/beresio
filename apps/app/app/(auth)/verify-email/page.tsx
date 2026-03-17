import { VerifyEmailView } from "./_components/verify-email-view";

export const metadata = {
    title: "Verifikasi Email | Beres",
    description: "Cek email kamu untuk link verifikasi",
};

export default async function VerifyEmailPage({
    searchParams,
}: {
    searchParams: Promise<{ email?: string }>;
}) {
    const { email } = await searchParams;

    return (
        <div className="w-full py-4 pb-12">
            <VerifyEmailView email={email ?? ""} />
        </div>
    );
}
