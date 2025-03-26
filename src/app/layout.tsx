import { Quantico } from 'next/font/google';
import './globals.css';
import type { Metadata } from 'next';

// Load Quantico font directly
const quantico = Quantico({ 
  weight: ['400', '700'],
  subsets: ['latin'],
});

export const metadata: Metadata = {
  title: 'Cheesecake Chat AI',
  description: 'Chat interface for Cheesecake AI to try all actions of the Cheesecake AI',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body className={quantico.className}>{children}</body>
    </html>
  );
}
