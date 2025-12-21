import type { Metadata } from "next";
import { Inter, JetBrains_Mono } from "next/font/google"; // Added JetBrains Mono for numbers/data
import "./globals.css";
import { Navbar } from "./components/Navbar";
import { Providers } from "./providers";
import { FontLoader } from "./components/FontLoader";
import { AppLoader } from "./components/AppLoader";

// Main font for UI text
const inter = Inter({ 
  subsets: ["latin"],
  variable: "--font-inter",
});

// Monospace font for prices, addresses, and data tables (Classic trading look)
const mono = JetBrains_Mono({ 
  subsets: ["latin"],
  variable: "--font-mono",
});

export const metadata: Metadata = {
  title: "Accuracy.Fun | Prediction Market Platform",
  description: "Predict the future with Accuracy.Fun",
  icons: {
    icon: "/favicon.ico",
  },
  openGraph: {
    title: "Accuracy.Fun | Prediction Market Platform",
    description: "Predict the future with Accuracy.Fun",
    url: "https://accuracy.fun",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className="dark">
      <body 
        className={`
          ${inter.variable} ${mono.variable} font-mono antialiased 
          bg-background text-white 
          selection:bg-monad-purple/30 selection:text-monad-purple
          min-h-screen relative overflow-x-hidden
        `}
      >
        <Providers>
          <AppLoader />
          <FontLoader />
          {/* Subtle Ambient Background Glow */}
          <div className="fixed inset-0 -z-10 h-full w-full bg-background">
            <div className="absolute top-0 left-1/2 -translate-x-1/2 w-full h-[500px] bg-monad-purple/5 blur-[120px] rounded-full pointer-events-none" />
          </div> 
          <Navbar />
          <main className="pt-20 pb-12">
            {children}
          </main>
        </Providers>
      </body>
    </html>
  );
}