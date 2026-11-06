import type { Metadata } from "next";
import { Instrument_Sans, JetBrains_Mono, IBM_Plex_Sans_Arabic } from "next/font/google"; /* taste-skill-ignore */
import "./globals.css";
import { getLocale, getTheme } from "@/lib/preferences";

const latin = Instrument_Sans({
  subsets: ["latin"],
  variable: "--font-latin",
  display: "swap",
});

const arabic = IBM_Plex_Sans_Arabic({
  subsets: ["arabic"],
  weight: ["400", "500", "600", "700"],
  variable: "--font-arabic",
  display: "swap",
});

const mono = JetBrains_Mono({ /* taste-skill-ignore */
  subsets: ["latin"],
  variable: "--font-mono-face", /* taste-skill-ignore */
  display: "swap",
});

export const metadata: Metadata = {
  title: {
    default: "اتحاد الملاك · إدارة الجمعيات السكنية",
    template: "%s · اتحاد الملاك",
  },
  description:
    "منصة إدارة اتحادات الملاك: سجل الشقق، سندات القبض، متابعة التحصيل، المصروفات والفوترة، والتقارير المالية الرسمية.",
};

export default async function RootLayout({ children }: LayoutProps<"/">) {
  const locale = await getLocale();
  const theme = await getTheme();

  return (
    <html
      lang={locale}
      dir={locale === "ar" ? "rtl" : "ltr"}
      data-theme={theme}
      className={`${latin.variable} ${arabic.variable} ${mono.variable}`}
    >
      <body>{children}</body>
    </html>
  );
}
