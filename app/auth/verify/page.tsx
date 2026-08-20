import { redirect } from "next/navigation";
import { signIn } from "@/lib/auth";

export default async function VerifyPage({
  searchParams,
}: {
  searchParams: Promise<{ token?: string }>;
}) {
  const { token } = await searchParams;
  if (!token) redirect("/auth");
  await signIn("kelvi", { kind: "magic", token, redirectTo: "/play/kelvi" });
}
