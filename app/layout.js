import { Inter } from 'next/font/google';
import './globals.css';
import { ReduxProvider } from '@/store/ReduxProvider';

const inter = Inter({ subsets: ['latin'] });

export const metadata = {
  title: 'CuraLink - Connecting Patients & Researchers',
  description: 'AI-powered platform connecting patients and researchers through clinical trials, publications, and health experts',
};

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <body className={inter.className}>
        <ReduxProvider>
          {children}
        </ReduxProvider>
      </body>
    </html>
  );
}
