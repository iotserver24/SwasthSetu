import './globals.css';
import { AuthProvider } from '@/context/AuthContext';
import Navbar from '@/components/Navbar';
import { Toaster } from 'react-hot-toast';

export const metadata = {
  title: 'SwasthyaSetu — Multilingual Clinical Workflow',
  description: 'A unified hospital system for multilingual doctor-patient consultations, structured medical records, and cross-department care coordination.',
};

export default function RootLayout({ children }) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body>
        <AuthProvider>
          <Navbar />
          <main style={{ minHeight: 'calc(100vh - 72px)', paddingTop: '72px' }}>
            {children}
          </main>
          <Toaster
            position="top-right"
            toastOptions={{
              style: {
                background: '#ffffff',
                color: '#0f172a',
                border: '1px solid rgba(148, 163, 184, 0.4)',
                borderRadius: '12px',
                boxShadow: '0 10px 25px rgba(15, 23, 42, 0.12)',
              },
            }}
          />
        </AuthProvider>
      </body>
    </html>
  );
}
