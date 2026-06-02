import type { Metadata } from "next";
import "./globals.css";
import { FinanceProvider } from "@/context/FinanceContext";
import AppShell from "@/components/AppShell";
import PwaRegister from "@/components/PwaRegister";

export const metadata: Metadata = {
  title: "Мои финансы",
  description: "Учет счетов, целей, операций, бюджетов и капитала",
  manifest: "/manifest.json",
  appleWebApp: {
    capable: true,
    statusBarStyle: "black-translucent",
    title: "Мои финансы",
  },
};

export const viewport = {
  themeColor: "#080A12",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="ru" suppressHydrationWarning>
      <body>
        <script
          dangerouslySetInnerHTML={{
            __html: `
              try {
                const theme = localStorage.getItem("theme") || "dark";

                document.documentElement.dataset.theme = theme;
                document.documentElement.classList.remove("theme-dark", "theme-light", "dark");
                document.documentElement.classList.add("theme-" + theme);

                if (theme === "dark") {
                  document.documentElement.classList.add("dark");
                }
              } catch {}
            `,
          }}
        />

        <FinanceProvider>
          <AppShell>{children}</AppShell>
          <PwaRegister />
        </FinanceProvider>
      </body>
    </html>
  );
}