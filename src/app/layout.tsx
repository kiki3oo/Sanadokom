import './globals.css';
import { LanguageProvider } from '@/context/LanguageContext';
import { StoreProvider } from '@/context/StoreContext';
import { AuthProvider } from '@/context/AuthContext';
import { PresenceProvider } from '@/context/PresenceContext';
import AppLayoutWrapper from '@/components/AppLayoutWrapper';

export const metadata = {
  title: 'COD Master SaaS - Plateforme E-commerce & Logistique Maroc',
  description: 'Gestion multi-boutiques, stock, centre d appels, suivi livraisons et calcul de profit net.',
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

