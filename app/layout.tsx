import type { Metadata, Viewport } from "next";
import { FinanceProvider } from "@/context/FinanceContext";
import AppShell from "@/components/AppShell";
import PwaRegister from "@/components/PwaRegister";
import "./globals.css";

export const metadata: Metadata = {
  title: "Мои финансы",
  description: "Приложение для учета личных финансов",
  manifest: "/manifest.json",
  icons: {
    icon: "/icon.svg",
    apple: "/icon.svg",
  },
  appleWebApp: {
    capable: true,
    title: "Финансы",
    statusBarStyle: "black-translucent",
  },
};

export const viewport: Viewport = {
  themeColor: "#080A12",
  width: "device-width",
  initialScale: 1,
  viewportFit: "cover",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="ru">
      <body className="bg-[#080A12]">
        <FinanceProvider>
          <AppShell>{children}</AppShell>
          <PwaRegister />
        </FinanceProvider>
      </body>
    </html>
  );
}