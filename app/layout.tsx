import { Geist_Mono, Instrument_Sans } from "next/font/google"

import "./globals.css"
import { ThemeProvider } from "@/components/theme-provider"
import { Toaster } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { cn } from "@/lib/utils";
import { Navbar } from "@/components/navbar";
import Footer from "@/components/footer";
import { AuthProvider } from "@/lib/auth-context";

const instrumentSans = Instrument_Sans({ subsets: ['latin'], variable: '--font-sans' })

const fontMono = Geist_Mono({
  subsets: ["latin"],
  variable: "--font-mono",
})

export const metadata = {
  title: "Job Application Tracker",
  description: "An app to organize and manage your job applications efficiently.",
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html
      lang="en"
      suppressHydrationWarning
      className={cn("antialiased", fontMono.variable, "font-sans", instrumentSans.variable)}
    >
      <body>
        <ThemeProvider>
          <AuthProvider>
            <TooltipProvider>
              <Navbar />
              <main className="min-h-screen">{children}</main>
              <Toaster />
              <Footer />
            </TooltipProvider>
          </AuthProvider>
        </ThemeProvider>
      </body>
    </html>
  )
}
