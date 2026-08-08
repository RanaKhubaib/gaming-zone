import { LoginForm } from "@/components/LoginForm";
import { useSettings } from "@/components/SettingsProvider";

export function LoginPage({ onSuccess }: { onSuccess?: () => void }) {
  const { shopName } = useSettings();
  return <LoginForm shopName={shopName} onSuccess={onSuccess} />;
}
