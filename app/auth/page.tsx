import { AuthForm } from "@/components/kelvi/AuthForm";

export default async function AuthPage({
  searchParams,
}: {
  searchParams: Promise<{ next?: string }>;
}) {
  const params = await searchParams;
  return <AuthForm next={params.next || "/play/kelvi"} />;
}
