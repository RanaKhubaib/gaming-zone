import type { Metadata } from "next";
import { DM_Sans } from "next/font/google";
import { Navbar } from "@/components/Navbar";
import { SettingsProvider } from "@/components/SettingsProvider";
import { getSession } from "@/lib/auth";
import { getAppSettings, settingsToCssVars } from "@/lib/settings";
import "./globals.css";

const dmSans = DM_Sans({
  variable: "--font-dm-sans",
  subsets: ["latin"],
  weight: ["400", "500", "600", "700"],
});

export async function generateMetadata(): Promise<Metadata> {
  const settings = await getAppSettings();
  const logoPath = settings.logoUrl
    ? settings.logoUrl.split("?")[0]
    : "/icon.svg";

  return {
    title: `${settings.shopName} Manager`,
    description: `Manage stations, sessions, and revenue for ${settings.shopName}`,
    icons: {
      icon: [{ url: logoPath }, { url: "/icon.svg" }],
      apple: [{ url: logoPath }],
      shortcut: logoPath,
    },
  };
}

export default async function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const settings = await getAppSettings();
  const cssVars = settingsToCssVars(settings);
  const session = await getSession();
  const showNav = Boolean(session);

  return (
    <html lang="en" className={`${dmSans.variable} h-full antialiased`}>
      <body
        className="min-h-full flex flex-col bg-slate-100 text-slate-900"
        style={cssVars as React.CSSProperties}
      >
        <SettingsProvider settings={settings}>
          {showNav && session ? (
            <Navbar
              displayName={session.displayName}
              username={session.username}
            />
          ) : null}
          <main
            className={
              showNav
                ? "mx-auto w-full max-w-7xl flex-1 px-4 py-6 sm:px-6"
                : "w-full flex-1"
            }
          >
            {children}
          </main>
        </SettingsProvider>
      </body>
    </html>
  );
}
