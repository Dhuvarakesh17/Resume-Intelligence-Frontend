import type { Metadata } from "next";
import { Plus_Jakarta_Sans } from "next/font/google";


import "./globals.css";
import { AuthProvider } from "@/context/AuthContext";
import ClientLayout from "@/components/ClientLayout";

const plusJakartaSans = Plus_Jakarta_Sans({
  weight: ["500", "700"],
  variable: "--font-plus-jakarta-sans",
  subsets: ["latin"],
});

const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || "https://resumeintelligence.ai";

export const metadata: Metadata = {
  metadataBase: new URL(siteUrl),
  title: {
    default: "Resume Intelligence AI | ATS Resume Analyzer",
    template: "%s | Resume Intelligence AI",
  },
  description:
    "AI-powered resume analysis for ATS optimization, skill-gap insights, and actionable recommendations to improve interview chances.",
  keywords: [
    "resume analyzer",
    "ATS resume checker",
    "AI resume analysis",
    "resume optimization",
    "resume score",
    "job application tools",
  ],
  alternates: {
    canonical: "/",
  },
  openGraph: {
    type: "website",
    url: "/",
    siteName: "Resume Intelligence AI",
    title: "Resume Intelligence AI | ATS Resume Analyzer",
    description:
      "Analyze and improve your resume using AI-powered ATS scoring, recommendations, and role-fit insights.",
    images: [
      {
        url: "/job_vacancy.jpg",
        width: 1200,
        height: 630,
        alt: "Resume Intelligence AI dashboard preview",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "Resume Intelligence AI | ATS Resume Analyzer",
    description:
      "Analyze and improve your resume with AI-powered ATS scoring and actionable recommendations.",
    images: ["/job_vacancy.jpg"],
  },
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      "max-image-preview": "large",
      "max-snippet": -1,
      "max-video-preview": -1,
    },
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body
        className={` ${plusJakartaSans.variable} antialiased`}
      >
        <AuthProvider>
          <ClientLayout>
            {children}
          </ClientLayout>
        </AuthProvider>
      </body>
    </html>
  );
}
