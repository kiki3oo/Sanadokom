import { runtimeDataPath } from './runtimeData';
import fs from 'fs';
import path from 'path';
import { AVAILABLE_COURIERS } from '@/lib/couriers';

export interface CityRoutingRule {
  id: string;
  name: string;
  cities: string[];
  courier: string;
  isActive: boolean;
}

export interface CustomCourier {
  id: string;
  name: string;
  country: 'MA' | 'SN' | 'ALL';
  logoColor?: string;
  phone?: string;
  deliveryFee?: number;
}

export interface ShippingWorkflowConfig {
  mode: 'SINGLE_COURIER' | 'CITY_ROUTING';
  singleCourier: string; // Used when mode === 'SINGLE_COURIER'
  fallbackCourier: string; // Used when a city does not match any rule
  autoDispatchEnabled: boolean;
  scheduledTime: string; // e.g. "19:30"
  cityRoutingRules: CityRoutingRule[];
  customCouriers?: CustomCourier[];
  lastAutoDispatchAt?: string | null;
  lastDispatchedCount?: number;
}

const CONFIG_FILE_PATH = runtimeDataPath('shipping-workflow-config.json');

export const DEFAULT_SHIPPING_CONFIG: ShippingWorkflowConfig = {
  mode: 'SINGLE_COURIER', // Default to Single Courier as preferred by user
  singleCourier: 'CATHEDIS',
  fallbackCourier: 'CATHEDIS',
  autoDispatchEnabled: true,
  scheduledTime: '19:30',
  cityRoutingRules: [
    {
      id: 'rule-casa-rabat',
      name: 'Grand Casablanca & Rabat',
      cities: ['Casablanca', 'Rabat', 'Mohammedia', 'Salé', 'Témara', 'Bouskoura', 'Dar Bouazza', 'Nouaceur'],
      courier: 'CATHEDIS',
      isActive: true,
    },
    {
      id: 'rule-nord',
      name: 'Région Nord & Fès/Meknès',
      cities: ['Tanger', 'Tétouan', 'Fès', 'Meknès', 'Kenitra', 'Larache', 'Nador', 'Oujda'],
      courier: 'AMEEX',
      isActive: true,
    },
    {
      id: 'rule-sud',
      name: 'Région Sud & Marrakech',
      cities: ['Marrakech', 'Agadir', 'Essaouira', 'Taroudant', 'Ouarzazate', 'Guelmim', 'Laâyoune', 'Dakhla'],
      courier: 'OZONE',
      isActive: true,
    },
    {
      id: 'rule-senegal',
      name: 'Sénégal (Dakar & Régions)',
      cities: ['Dakar', 'Pikine', 'Guédiawaye', 'Rufisque', 'Thiès', 'Mbour', 'Saint-Louis', 'Touba'],
      courier: 'DAKAR_EXPRESS',
      isActive: true,
    },
  ],
};

export function loadShippingWorkflowConfig(): ShippingWorkflowConfig {
  try {
    if (fs.existsSync(CONFIG_FILE_PATH)) {
      const data = fs.readFileSync(CONFIG_FILE_PATH, 'utf-8');
      const parsed = JSON.parse(data);
      return { ...DEFAULT_SHIPPING_CONFIG, ...parsed };
    }
  } catch (err) {
    console.error('Error loading shipping workflow config:', err);
  }
  return DEFAULT_SHIPPING_CONFIG;
}

export function saveShippingWorkflowConfig(config: Partial<ShippingWorkflowConfig>): ShippingWorkflowConfig {
  try {
    const current = loadShippingWorkflowConfig();
    const updated = { ...current, ...config };
    const dir = path.dirname(CONFIG_FILE_PATH);
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true });
    }
    fs.writeFileSync(CONFIG_FILE_PATH, JSON.stringify(updated, null, 2), 'utf-8');
    return updated;
  } catch (err) {
    console.error('Error saving shipping workflow config:', err);
    throw err;
  }
}

/**
 * Resolves which courier company should receive the order based on customer city and currency/country
 */
export function resolveCourierForOrder(
  city: string,
  currency: string = 'MAD',
  config?: ShippingWorkflowConfig
): { courier: string; matchedRuleName?: string; mode: 'SINGLE_COURIER' | 'CITY_ROUTING' } {
  const currentConfig = config || loadShippingWorkflowConfig();

  // If Senegal currency XOF, default to Senegal carrier
  if (currency === 'XOF') {
    return { courier: 'DAKAR_EXPRESS', matchedRuleName: 'Sénégal (XOF)', mode: currentConfig.mode };
  }

  // 1. If Single Courier Mode is active -> Return the chosen single company
  if (currentConfig.mode === 'SINGLE_COURIER') {
    return {
      courier: currentConfig.singleCourier || 'CATHEDIS',
      matchedRuleName: 'Société Unique Dédiée',
      mode: 'SINGLE_COURIER',
    };
  }

  // 2. If City Routing Mode is active -> Match by city name
  const cleanCity = (city || '').trim().toLowerCase();

  for (const rule of currentConfig.cityRoutingRules) {
    if (!rule.isActive) continue;
    const match = rule.cities.some((c) => {
      const ruleCity = c.trim().toLowerCase();
      return cleanCity === ruleCity || cleanCity.includes(ruleCity) || ruleCity.includes(cleanCity);
    });

    if (match) {
      return {
        courier: rule.courier,
        matchedRuleName: rule.name,
        mode: 'CITY_ROUTING',
      };
    }
  }

  // Fallback if no specific rule matched
  return {
    courier: currentConfig.fallbackCourier || 'CATHEDIS',
    matchedRuleName: 'Transporteur par Défaut (Hors Zone Spécifique)',
    mode: 'CITY_ROUTING',
  };
}

export function getAllCouriers(config?: ShippingWorkflowConfig) {
  const current = config || loadShippingWorkflowConfig();
  return [...AVAILABLE_COURIERS, ...(current.customCouriers || [])];
}
