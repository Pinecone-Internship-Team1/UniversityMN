import type { Metadata } from "next";
import { ClerkProvider } from "@clerk/nextjs";
import { Unbounded, PT_Sans } from "next/font/google";
import "./global.css";

const unbounded = Unbounded({
  subsets: ["latin", "cyrillic"],
  weight: ["500", "600", "700", "800"],
  variable: "--font-unbounded",
  display: "swap",
});

const ptSans = PT_Sans({
  subsets: ["latin", "cyrillic"],
  weight: ["400", "700"],
  variable: "--font-pt-sans",
  display: "swap",
});

export const metadata: Metadata = {
  title: "Oyutan MN — Монголын их, дээд сургуулиудыг нэг дороос",
  description:
    "ЭЕШ оноо, мэргэжил, сургалтын төлбөр, тэтгэлэг болон бусад мэдээллээр өөрт тохирох сургуулиа олоорой.",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <ClerkProvider afterSignOutUrl="/">
      <html lang="mn" className={`${unbounded.variable} ${ptSans.variable}`}>
        <body>{children}</body>
      </html>
    </ClerkProvider>
  );
}
