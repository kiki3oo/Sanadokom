# 🚀 COD Master SaaS — Plateforme E-commerce & Logistique Maroc

Une plateforme SaaS moderne conçue sur-mesure pour les entrepreneurs e-commerce et le business Cash On Delivery (COD) au Maroc et région MENA.

---

## 🌟 Fonctionnalités Implémentées

### 1. 📦 Gestion du Stock & Inventaire
- Suivi en temps réel des stocks par boutique / projet.
- Alertes automatiques de rupture (Seuil personnalisable par produit).
- **Déduction automatique du stock** dès qu'un agent confirme une commande.
- **Réintégration automatique au stock** en cas de retour colis (NPAI/Refus).
- Historique complet des mouvements (Arrivage fournisseur, ajustement manuel, défectueux, ventes).

### 2. 🌐 Réception Universelle des Commandes (Webhooks)
- Endpoint unique : `POST /api/webhooks/orders`
- Compatible avec **tous vos sites** : YouCan, Shopify, WooCommerce, Webflow, Landing Pages HTML/JS sur-mesure, et formulaires Google Sheets.
- **Anti-doublon intelligent** : Détection des clients qui commandent plusieurs fois dans les 24h.
- Attribution automatique des leads aux agents actifs du centre d'appel (Round-robin).

### 3. 🎧 Centre d'Appel (CRM Confirmation Agents)
- Interface ultra-rapide dédiée au traitement des leads :
  - Bouton direct **WhatsApp** en 1 clic (`wa.me/212...`).
  - Bouton direct **Click-to-Call**.
  - **Confirmation en 1 clic** : vérification de stock et déduction immédiate.
  - **Pas de réponse** : incrémentation automatique du compteur de tentatives.
  - **Rappeler plus tard** : programmation de rappel avec date/heure.
  - **Annulation client** : avec sélection du motif (Prix, hésitation, etc.).

### 4. 🚚 Expédition & Suivi Post-Confirmation
- Sélection multiple de commandes confirmées.
- **Expédition en masse** vers les transporteurs partenaires :
  - **Cathedis**
  - **Ameex**
  - **Ozone Delivery**
  - **EcoTrack**
  - **Livraison Interne / Manuel**
- Génération automatique des numéros de tracking et étiquettes.
- Suivi du taux de livraison (%) et du taux de retour (%).

### 5. 💰 Le Calcul du Business & Résultat Net (P&L Réel)
Calcul en temps réel de votre véritable bénéfice net selon la formule :
$$\text{Profit Net} = \text{CA Livré (Encaissé)} - \text{Coût d'Achat (COGS)} - \text{Frais de Livraison \& Retours} - \text{Dépenses Facebook Ads} - \text{Charges \& Commissions}$$
- ROAS Réel calculé uniquement sur les commandes livrées et payées.
- Répartition géographique des ventes par ville au Maroc (Casablanca, Rabat, Marrakech, Fès, Tanger, Agadir...).

### 6. 📢 API Facebook Ads & CAPI
- **Conversions API (CAPI)** : Envoi côté serveur des événements `Lead` et `Purchase` (postback après confirmation).
- **Marketing API Spend** : Synchronisation automatique des dépenses publicitaires quotidiennes par compte publicitaire (`act_...`).

### 7. 🔌 Simulateur Webhook Intégré
- Testez l'envoi de commandes virtuelles directement depuis l'interface `/simulator` pour vérifier le flux en temps réel sans attendre de vraie commande.

---

## 🛠️ Stack Technique

- **Framework** : [Next.js 14](https://nextjs.org/) (App Router, Server Actions, API Routes)
- **Langage** : TypeScript
- **Design** : Tailwind CSS, Lucide Icons, Shadcn-style components
- **Base de données & ORM** : Prisma ORM avec SQLite (développement local) & compatible 100% PostgreSQL pour la production (Supabase / Neon / Railway)

---

## 🚀 Démarrage Rapide

```bash
# 1. Cloner ou ouvrir le dossier
cd /Users/mcm/Desktop/Saas

# 2. Lancer le serveur de développement
npm run dev
```

L'application est accessible sur : **`http://localhost:3000`**

---

## 📁 Architecture des Fichiers

```
src/
├── app/
│   ├── page.tsx                 # Dashboard & Calcul Financier P&L
│   ├── call-center/page.tsx     # CRM Centre d'Appel des agents
│   ├── orders/page.tsx          # Gestion des commandes & expéditions
│   ├── stock/page.tsx           # Gestion du stock & alertes
│   ├── expenses/page.tsx        # Dépenses, pubs et charges
│   ├── integrations/page.tsx    # Webhooks, Facebook CAPI & Transporteurs
│   ├── simulator/page.tsx       # Simulateur de leads en direct
│   └── api/
│       ├── webhooks/orders/     # Récepteur webhook pour vos landing pages
│       ├── call-center/call/    # Action d'appel & confirmation stock
│       ├── shipping/dispatch/   # Envoi API vers les transporteurs
│       ├── analytics/           # Calculs de rentabilité et KPIs
│       ├── stock/               # API gestion de stock
│       └── integrations/        # Sync Facebook et configurations
├── lib/
│   ├── couriers/                # Adaptateurs Cathedis, Ameex, Ozone
│   ├── facebook/                # Facebook CAPI & Marketing API spend
│   └── prisma.ts                # Client Singleton Prisma
└── prisma/
    ├── schema.prisma            # Modèle de données complet
    └── seed.js                  # Données de démonstration réalistes
```
