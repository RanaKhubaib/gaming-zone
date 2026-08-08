import { getAppSettings } from "@/lib/settings";
import { LoginForm } from "@/components/LoginForm";

export const dynamic = "force-dynamic";

export default async function LoginPage() {
  const settings = await getAppSettings();

  return <LoginForm shopName={settings.shopName} />;
}
