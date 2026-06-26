import type { Metadata } from "next";
import { Geist, Geist_Mono, IBM_Plex_Sans_Arabic } from "next/font/google";
import { ThemeProvider } from "next-themes";
import { cookies, headers } from "next/headers";
import { NextIntlClientProvider } from "next-intl";
import { getMessages } from "next-intl/server";
import "./globals.css";
import { dehydrate, QueryClient } from '@tanstack/react-query';
import { Toaster } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { Providers } from "@/components/providers";
import { LocaleProvider } from "@/components/locale-provider";
import { BrandColorProvider } from "@/components/domain/shell/brand-color-provider";
import { prefetchTenant } from "@/lib/tenant/server";
import { getBrandDescription } from "@/lib/utils/use-brand-name";

const PRODUCT_NAME: Record<string, string> = {
  ar: 'مومنتوم',
  en: 'Momentum',
};

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'https://api.momentum.test';

export async function generateMetadata(): Promise<Metadata> {
  const cookieStore = await cookies();
  const headerStore = await headers();
  const locale = cookieStore.get("NEXT_LOCALE")?.value ?? "ar";
  const host = headerStore.get("host") ?? "";
  const slug = host.split('.')[0];

  const product = PRODUCT_NAME[locale] ?? PRODUCT_NAME.en;
  let tenantName: string | null = null;
  try {
    const res = await fetch(`${API_URL}/v1`, {
      headers: { 'X-Tenant': slug, 'Accept': 'application/json' },
    });
    const data = await res.json();
    tenantName = locale === 'ar' ? data?.tenant?.name_ar : data?.tenant?.name_en;
  } catch {}

  return {
    title: `${product} - ${tenantName ?? 'Gov TMS'}`,
    description: getBrandDescription(locale),
  };
}

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

const ibmPlexArabic = IBM_Plex_Sans_Arabic({
  variable: "--font-ibm-plex-arabic",
  subsets: ["arabic"],
  weight: ["400", "500", "600", "700"],
});

export default async function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const cookieStore = await cookies();
  const locale = cookieStore.get("NEXT_LOCALE")?.value ?? "ar";
  const dir = locale === "ar" ? "rtl" : "ltr";
  const messages = await getMessages();

  const queryClient = new QueryClient();
  await prefetchTenant(queryClient);
  const dehydratedState = dehydrate(queryClient);

  return (
    <html
      lang={locale}
      dir={dir}
      suppressHydrationWarning
      className={`${geistSans.variable} ${ibmPlexArabic.variable} ${geistMono.variable} h-full antialiased`}
      style={{ fontFamily: locale === 'ar' ? 'IBM Plex Sans Arabic, sans-serif' : 'Geist, sans-serif' }}
    >
      <body className="min-h-full flex flex-col">
        <script dangerouslySetInnerHTML={{
          __html: `(function(){try{var c=JSON.parse(localStorage.getItem('brand-color'));var n=c&&c.state&&c.state.color;if(n){var h={amber:'#9A3B00',blue:'#1d4ed8',emerald:'#059669',rose:'#be123c',slate:'#475569'}[n];if(h){document.documentElement.style.setProperty('--color-primary',h);document.documentElement.style.setProperty('--primary',h)}}}catch(e){}})()`
        }} />
        <Providers dehydratedState={dehydratedState}>
          <BrandColorProvider />
          <LocaleProvider initialLocale={locale}>
            <NextIntlClientProvider locale={locale} messages={messages}>
              <ThemeProvider attribute="class" defaultTheme="system" enableSystem disableTransitionOnChange>
                <TooltipProvider>{children}</TooltipProvider>
                <Toaster />
              </ThemeProvider>
            </NextIntlClientProvider>
          </LocaleProvider>
        </Providers>
      </body>
    </html>
  );
}
