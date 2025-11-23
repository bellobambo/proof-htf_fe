import type { Metadata } from "next";
import { Titillium_Web } from "next/font/google";
import "./globals.css";
import { Toaster } from 'react-hot-toast';
import { ConfigProvider } from "antd";
import { Providers } from "./components/Provider";
import Navbar from "./components/Navbar";
import { LingoProvider, loadDictionary } from "lingo.dev/react/rsc";
import { LocaleSwitcher } from "lingo.dev/react/client";


const titillium = Titillium_Web({
  variable: "--font-titillium",
  subsets: ["latin"],
  weight: ["300", "400", "600", "700", "900"],
  display: "swap",
});

export const metadata: Metadata = {
  title: "Proof",
  description: "Decentralized education platform with blockchain-verified certificates",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <LingoProvider loadDictionary={(locale) => loadDictionary(locale)}>

      <html lang="en">
        <body className={`${titillium.variable} antialiased`}>
          <Toaster
            position="bottom-right"
            toastOptions={{
              duration: 4000,
              style: {
                background: '#5D4037',
                color: '#F5F5DC',
                borderRadius: '8px',
                fontSize: '14px',
                padding: '12px 16px',
                border: '2px solid #8D6E63',
              },
              success: { style: { background: '#5D4037', color: '#F5F5DC', border: '2px solid #8D6E63' }, duration: 3000 },
              error: { style: { background: '#5D4037', color: '#F5F5DC', border: '2px solid #8D6E63' }, duration: 5000 },
              loading: { style: { background: '#5D4037', color: '#F5F5DC', border: '2px solid #8D6E63' } },
            }}
          />
          <ConfigProvider
            theme={{
              token: {
                colorPrimary: '#8D6E63', // medium brown as primary
                colorBgBase: '#4E342E',   // deep chocolate brown background
                colorTextBase: '#F5F5DC', // creamish yellow text
                colorBorder: '#8D6E63',   // medium brown borders
                borderRadius: 8,
                wireframe: false,
              },
              components: {
                Button: {
                  colorPrimary: '#5D4037',
                  colorPrimaryHover: '#6D4C41',
                  colorPrimaryActive: '#4E342E',
                  colorTextLightSolid: '#F5F5DC',
                },
                Input: {
                  colorBgContainer: '#5D4037',
                  colorBorder: '#8D6E63',
                  colorText: '#F5F5DC',
                  colorTextPlaceholder: '#A1887F',
                  hoverBorderColor: '#F5F5DC',
                  activeBorderColor: '#8D6E63',
                },
                Card: {
                  colorBgContainer: '#5D4037',
                  colorBorder: '#8D6E63',
                  colorText: '#F5F5DC'
                },
                Modal: {
                  colorBgMask: 'rgba(78, 52, 46, 0.8)',
                  colorBgElevated: '#5D4037',
                  colorText: '#F5F5DC',
                  colorIcon: '#F5F5DC',
                },
                Select: {
                  colorBgContainer: '#5D4037',
                  colorBorder: '#8D6E63',
                  colorText: '#F5F5DC',
                  colorTextPlaceholder: '#A1887F',
                },
                Table: {
                  colorBgContainer: '#5D4037',
                  colorBorder: '#8D6E63',
                  colorText: '#F5F5DC',
                  colorTextHeading: '#F5F5DC',
                }
              }
            }}
          >
            <Providers>
              <Navbar />
              {children}
            </Providers>
          </ConfigProvider>
        </body>
      </html>

    </LingoProvider>

  );
}