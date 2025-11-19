import type { Metadata } from "next";
import { Space_Grotesk, Orbitron } from "next/font/google";
import { JetBrains_Mono } from "next/font/google";
import "./globals.css";
// import { UserStatusCompact } from "@/components/Navbar";
import { Toaster } from 'react-hot-toast';
import { ConfigProvider } from "antd";
import { Providers } from "./components/Provider";

const spaceGrotesk = Space_Grotesk({
  variable: "--font-space-grotesk",
  subsets: ["latin"],
  display: "swap",
});

const orbitron = Orbitron({
  variable: "--font-orbitron",
  subsets: ["latin"],
  display: "swap",
});

const jetbrainsMono = JetBrains_Mono({
  variable: "--font-jetbrains-mono",
  subsets: ["latin"],
  display: "swap",
});

export const metadata: Metadata = {
  title: "Proof Somnia",
  description: "Decentralized education platform with blockchain-verified certificates on somnia network.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body
        className={`${spaceGrotesk.variable} ${orbitron.variable} ${jetbrainsMono.variable} antialiased bg-[#F5F5DC] font-sans`}
      >
        <Toaster
          position="bottom-right"
          toastOptions={{
            duration: 4000,
            style: {
              background: '#D2B48C',
              color: '#8B4513',
              borderRadius: '8px',
              fontSize: '14px',
              padding: '12px 16px',
              border: '2px solid #8B4513',
            },
            success: {
              duration: 3000,
              style: {
                background: '#D2B48C', 
                color: '#8B4513',
                border: '2px solid #8B4513',
              },
            },
            error: {
              duration: 5000,
              style: {
                background: '#D2B48C', 
                color: '#8B4513',
                border: '2px solid #8B4513',
              },
            },
            loading: {
              style: {
                background: '#D2B48C',
                color: '#8B4513',
                border: '2px solid #8B4513',
              },
            },
          }}
        />
        <ConfigProvider
          theme={{
            token: {
              colorPrimary: '#8B4513', // Baby brown for primary color
              colorBgBase: '#F5F5DC', // Baby cream for background
              colorTextBase: '#8B4513', // Baby brown for text
              colorBorder: '#8B4513', // Baby brown for borders
              borderRadius: 8,
              wireframe: false,
            },
            components: {
              Button: {
                colorPrimary: '#D2B48C', // Lighter brown for buttons
                colorPrimaryHover: '#C19A6B', // Darker brown on hover
                colorPrimaryActive: '#A52A2A',
                colorTextLightSolid: '#8B4513', // Dark brown text on buttons
              },
              Input: {
                colorBgContainer: '#FFFFFF',
                colorBorder: '#8B4513',
                colorText: '#8B4513',
                colorTextPlaceholder: '#D2B48C',
                hoverBorderColor: '#C19A6B',
                activeBorderColor: '#8B4513',
              },
              Card: {
                colorBgContainer: '#FFFFFF',
                colorBorder: '#8B4513',
              },
              Modal: {
                colorBgMask: 'rgba(139, 69, 19, 0.1)',
                colorBgElevated: '#F5F5DC',
                colorText: '#8B4513',
              }
            }
          }}
        >
          <Providers>
            {/* <UserStatusCompact /> */}
            {children}
          </Providers>
        </ConfigProvider>
      </body>
    </html>
  );
}