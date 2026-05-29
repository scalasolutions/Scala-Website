import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Scala Control Plane",
  description: "System administration and billing dashboard for Scala solutions.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="en"
      suppressHydrationWarning
      className={`${geistSans.variable} ${geistMono.variable} h-full antialiased`}
    >
      <head>
        <script
          dangerouslySetInnerHTML={{
            __html: `
              (function() {
                try {
                  // Public marketing routes (/, /services) are force-dark —
                  // see app/(public)/layout.tsx. We mirror that decision here
                  // pre-hydration so there's no light-mode flash on first
                  // paint when a user lands on a marketing page with a
                  // stored 'light' theme preference. The preference stays in
                  // localStorage untouched, so admin/portal still honor it.
                  var path = window.location.pathname;
                  var isPublic = path === '/' || path === '/services' || path.indexOf('/services/') === 0;
                  if (isPublic) {
                    document.documentElement.classList.add('dark');
                    return;
                  }
                  var theme = localStorage.getItem('theme');
                  if (theme === 'dark') {
                    document.documentElement.classList.add('dark');
                  } else {
                    document.documentElement.classList.remove('dark');
                  }
                } catch (e) {}
              })();
            `,
          }}
        />
      </head>
      <body className="min-h-full flex flex-col">{children}</body>
    </html>
  );
}
