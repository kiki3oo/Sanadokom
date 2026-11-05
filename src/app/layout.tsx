import './globals.css';
import { LanguageProvider } from '@/context/LanguageContext';
import { StoreProvider } from '@/context/StoreContext';
import { AuthProvider } from '@/context/AuthContext';
import { PresenceProvider } from '@/context/PresenceContext';
import AppLayoutWrapper from '@/components/AppLayoutWrapper';

export const metadata = {
  title: 'Sanadokom | سندكم - ERP E-Commerce & Logistique COD',
  description: 'Sanadokom: Gestion multi-boutiques, stock en temps réel, centre d\'appels, suivi livraisons et calcul de profit net.',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="fr">
      <body className="bg-slate-50 text-slate-900 antialiased">
        <LanguageProvider>
          <AuthProvider>
            <StoreProvider>
              <PresenceProvider>
                <AppLayoutWrapper>{children}</AppLayoutWrapper>
              </PresenceProvider>
            </StoreProvider>
          </AuthProvider>
        </LanguageProvider>
      </body>
    </html>
  );
}

