// ─── Overlay Asset Type Definitions & Data Generation ─────────────────────
// Defines all placeable asset types, their visual properties, and functions
// for generating realistic simulated telemetry for each asset.
// ───────────────────────────────────────────────────────────────────────────

export type OverlayAssetType =
  | 'solar'
  | 'wind'
  | 'battery'
  | 'ev'
  | 'hospital'
  | 'school'
  | 'commercial'
  | 'residential'
  | 'substation'
  | 'streetlight'
  | 'satellite';

export type PlacedBy = 'citizen' | 'government';

export interface AssetLiveData {
  production: number;    // kW produced (0 for consumers)
  consumption: number;   // kW consumed (0 for producers)
  status: 'online' | 'warning' | 'offline' | 'maintenance';
  efficiency: number;    // 0-100%
  uptime: number;        // 0-100%
  coverageKm?: number;   // For satellites only
  signalStrength?: number; // For satellites only 0-100
}

export interface PlacedAsset {
  id: string;
  type: OverlayAssetType;
  name: string;
  lon: number;
  lat: number;
  emoji: string;
  color: string;
  hologramColor: string;
  placedBy: PlacedBy;
  liveData: AssetLiveData;
  timestamp: number;
  altitude?: number; // For satellites, km
  orbitType?: 'LEO' | 'MEO' | 'GEO';
}

export interface AssetTemplate {
  type: OverlayAssetType;
  emoji: string;
  label: string;
  color: string;
  hologramColor: string;
  productionRange: [number, number]; // [min, max] kW
  consumptionRange: [number, number];
  description: string;
}

// ─── Asset Template Catalog ─────────────────────────────────────────────────

export const ASSET_TEMPLATES: AssetTemplate[] = [
  {
    type: 'solar',
    emoji: '☀️',
    label: 'Solar Panel',
    color: '#ffd700',
    hologramColor: '#ffd700',
    productionRange: [50, 2500],
    consumptionRange: [0, 0],
    description: 'Rooftop photovoltaic array',
  },
  {
    type: 'wind',
    emoji: '🌬️',
    label: 'Wind Turbine',
    color: '#00f5ff',
    hologramColor: '#00e5ff',
    productionRange: [100, 3000],
    consumptionRange: [0, 0],
    description: 'Horizontal-axis wind turbine',
  },
  {
    type: 'battery',
    emoji: '🔋',
    label: 'Battery Storage',
    color: '#39ff14',
    hologramColor: '#39ff14',
    productionRange: [0, 500],
    consumptionRange: [0, 200],
    description: 'Li-Ion energy storage unit',
  },
  {
    type: 'ev',
    emoji: '🚗',
    label: 'EV Charging',
    color: '#bf00ff',
    hologramColor: '#d050ff',
    productionRange: [0, 0],
    consumptionRange: [20, 350],
    description: 'Electric vehicle fast charger',
  },
  {
    type: 'hospital',
    emoji: '🏥',
    label: 'Hospital',
    color: '#ff0844',
    hologramColor: '#ff2060',
    productionRange: [0, 0],
    consumptionRange: [400, 800],
    description: 'Critical medical facility',
  },
  {
    type: 'school',
    emoji: '🏫',
    label: 'School',
    color: '#4361ee',
    hologramColor: '#5080ff',
    productionRange: [0, 0],
    consumptionRange: [100, 300],
    description: 'Educational institution',
  },
  {
    type: 'commercial',
    emoji: '🏢',
    label: 'Commercial',
    color: '#ff6b35',
    hologramColor: '#ff8050',
    productionRange: [0, 0],
    consumptionRange: [500, 3500],
    description: 'Commercial/office building',
  },
  {
    type: 'residential',
    emoji: '🏠',
    label: 'Residential',
    color: '#8892a4',
    hologramColor: '#a0b0c8',
    productionRange: [0, 0],
    consumptionRange: [50, 250],
    description: 'Residential housing block',
  },
  {
    type: 'substation',
    emoji: '⚡',
    label: 'Substation',
    color: '#ffd700',
    hologramColor: '#ffe060',
    productionRange: [0, 0],
    consumptionRange: [0, 0],
    description: 'Power distribution substation',
  },
  {
    type: 'streetlight',
    emoji: '💡',
    label: 'Streetlight',
    color: '#ffd700',
    hologramColor: '#fff3a0',
    productionRange: [0, 0],
    consumptionRange: [0.5, 2],
    description: 'Smart LED streetlight',
  },
  {
    type: 'satellite',
    emoji: '🛰️',
    label: 'Satellite',
    color: '#00f5ff',
    hologramColor: '#00ffee',
    productionRange: [0, 0],
    consumptionRange: [0, 0],
    description: 'Monitoring & imaging satellite',
  },
];

// ─── Data Generation ────────────────────────────────────────────────────────

/** Returns a random float in [min, max). */
function rand(min: number, max: number): number {
  return min + Math.random() * (max - min);
}

/** Generate realistic live telemetry for a given asset type. */
export function generateAssetData(type: OverlayAssetType, simulatedHour?: number): AssetLiveData {
  const template = ASSET_TEMPLATES.find((t) => t.type === type)!;
  const hour = simulatedHour !== undefined ? simulatedHour : new Date().getHours();

  // Time-of-day factor for solar
  let solarFactor = 1;
  if (type === 'solar') {
    // Bell curve peaking at noon
    solarFactor = Math.max(0, Math.sin(((hour - 6) / 12) * Math.PI));
    if (hour < 6 || hour > 18) solarFactor = 0;
  }

  // Wind is stronger at night
  let windFactor = 1;
  if (type === 'wind') {
    windFactor = 0.6 + 0.4 * Math.cos(((hour - 12) / 12) * Math.PI);
  }

  const production =
    type === 'solar'
      ? rand(template.productionRange[0], template.productionRange[1]) * solarFactor
      : type === 'wind'
        ? rand(template.productionRange[0], template.productionRange[1]) * windFactor
        : rand(template.productionRange[0], template.productionRange[1]);

  const consumption = rand(template.consumptionRange[0], template.consumptionRange[1]);

  // Random status with weighted probabilities
  const statusRoll = Math.random();
  const status: AssetLiveData['status'] =
    statusRoll < 0.85 ? 'online' : statusRoll < 0.93 ? 'warning' : statusRoll < 0.98 ? 'maintenance' : 'offline';

  const efficiency = status === 'online' ? rand(82, 99) : status === 'warning' ? rand(55, 82) : rand(10, 55);
  const uptime = status === 'offline' ? 0 : rand(90, 99.9);

  const base: AssetLiveData = {
    production: Math.round(production * 10) / 10,
    consumption: Math.round(consumption * 10) / 10,
    status,
    efficiency: Math.round(efficiency * 10) / 10,
    uptime: Math.round(uptime * 10) / 10,
  };

  // Satellite-specific data
  if (type === 'satellite') {
    base.coverageKm = Math.round(rand(50, 400));
    base.signalStrength = Math.round(rand(60, 99));
  }

  return base;
}

/** Scatter `count` assets randomly within `radiusKm` of a center point. */
export function generateRandomPlacements(
  type: OverlayAssetType,
  count: number,
  centerLon: number,
  centerLat: number,
  radiusKm: number = 5,
  placedBy: PlacedBy = 'citizen'
): PlacedAsset[] {
  const template = ASSET_TEMPLATES.find((t) => t.type === type)!;
  // Approximate degrees per km
  const degPerKm = 1 / 111;
  const assets: PlacedAsset[] = [];

  for (let i = 0; i < count; i++) {
    const angle = Math.random() * 2 * Math.PI;
    const dist = Math.random() * radiusKm;
    const dLon = dist * degPerKm * Math.cos(angle);
    const dLat = dist * degPerKm * Math.sin(angle);

    const lon = centerLon + dLon;
    const lat = centerLat + dLat;

    const orbitTypes: Array<'LEO' | 'MEO' | 'GEO'> = ['LEO', 'MEO', 'GEO'];

    assets.push({
      id: `${type}-${Date.now()}-${i}`,
      type,
      name: `${template.label} #${i + 1}`,
      lon,
      lat,
      emoji: template.emoji,
      color: template.color,
      hologramColor: template.hologramColor,
      placedBy,
      liveData: generateAssetData(type),
      timestamp: Date.now(),
      ...(type === 'satellite'
        ? {
            altitude: [200, 2000, 36000][Math.floor(Math.random() * 3)],
            orbitType: orbitTypes[Math.floor(Math.random() * 3)],
          }
        : {}),
    });
  }

  return assets;
}

/** Get the template for a given asset type. */
export function getTemplate(type: OverlayAssetType): AssetTemplate {
  return ASSET_TEMPLATES.find((t) => t.type === type)!;
}

export const INITIAL_CITY_ASSETS: PlacedAsset[] = [
  {
    id: 'solar-1',
    type: 'solar',
    name: 'Solar Farm - Anna Nagar',
    lon: 80.2099,
    lat: 13.0850,
    emoji: '☀️',
    color: '#ffd700',
    hologramColor: '#ffd700',
    placedBy: 'government',
    liveData: {
      production: 1850.0,
      consumption: 0.0,
      status: 'online',
      efficiency: 95.0,
      uptime: 99.9
    },
    timestamp: 1719830000000
  },
  {
    id: 'solar-2',
    type: 'solar',
    name: 'Solar Rooftop - T Nagar',
    lon: 80.2333,
    lat: 13.0400,
    emoji: '☀️',
    color: '#ffd700',
    hologramColor: '#ffd700',
    placedBy: 'government',
    liveData: {
      production: 800.0,
      consumption: 0.0,
      status: 'online',
      efficiency: 92.0,
      uptime: 99.9
    },
    timestamp: 1719830000000
  },
  {
    id: 'solar-3',
    type: 'solar',
    name: 'Solar Farm - OMR',
    lon: 80.2440,
    lat: 12.9600,
    emoji: '☀️',
    color: '#ffd700',
    hologramColor: '#ffd700',
    placedBy: 'government',
    liveData: {
      production: 3200.0,
      consumption: 0.0,
      status: 'online',
      efficiency: 94.0,
      uptime: 99.9
    },
    timestamp: 1719830000000
  },
  {
    id: 'wind-1',
    type: 'wind',
    name: 'Wind Farm - Marina',
    lon: 80.2838,
    lat: 13.0500,
    emoji: '🌬️',
    color: '#00f5ff',
    hologramColor: '#00e5ff',
    placedBy: 'government',
    liveData: {
      production: 2200.0,
      consumption: 0.0,
      status: 'online',
      efficiency: 89.0,
      uptime: 99.5
    },
    timestamp: 1719830000000
  },
  {
    id: 'wind-2',
    type: 'wind',
    name: 'Wind Farm - ECR',
    lon: 80.2550,
    lat: 12.9300,
    emoji: '🌬️',
    color: '#00f5ff',
    hologramColor: '#00e5ff',
    placedBy: 'government',
    liveData: {
      production: 1500.0,
      consumption: 0.0,
      status: 'online',
      efficiency: 91.0,
      uptime: 99.5
    },
    timestamp: 1719830000000
  },
  {
    id: 'battery-1',
    type: 'battery',
    name: 'Battery Hub - Guindy',
    lon: 80.2120,
    lat: 13.0067,
    emoji: '🔋',
    color: '#39ff14',
    hologramColor: '#39ff14',
    placedBy: 'government',
    liveData: {
      production: 0.0,
      consumption: 0.0,
      status: 'online',
      efficiency: 96.0,
      uptime: 99.9
    },
    timestamp: 1719830000000
  },
  {
    id: 'battery-2',
    type: 'battery',
    name: 'Battery Hub - Adyar',
    lon: 80.2575,
    lat: 13.0063,
    emoji: '🔋',
    color: '#39ff14',
    hologramColor: '#39ff14',
    placedBy: 'government',
    liveData: {
      production: 0.0,
      consumption: 0.0,
      status: 'online',
      efficiency: 95.0,
      uptime: 99.9
    },
    timestamp: 1719830000000
  },
  {
    id: 'ev-1',
    type: 'ev',
    name: 'EV Station - Phoenix Mall',
    lon: 80.2300,
    lat: 13.0113,
    emoji: '🚗',
    color: '#bf00ff',
    hologramColor: '#d050ff',
    placedBy: 'government',
    liveData: {
      production: 0.0,
      consumption: 180.0,
      status: 'online',
      efficiency: 98.0,
      uptime: 99.9
    },
    timestamp: 1719830000000
  },
  {
    id: 'ev-2',
    type: 'ev',
    name: 'EV Station - Express Avenue',
    lon: 80.2635,
    lat: 13.0600,
    emoji: '🚗',
    color: '#bf00ff',
    hologramColor: '#d050ff',
    placedBy: 'government',
    liveData: {
      production: 0.0,
      consumption: 120.0,
      status: 'online',
      efficiency: 97.0,
      uptime: 99.9
    },
    timestamp: 1719830000000
  },
  {
    id: 'ev-3',
    type: 'ev',
    name: 'EV Hub - OMR',
    lon: 80.2510,
    lat: 12.9500,
    emoji: '🚗',
    color: '#bf00ff',
    hologramColor: '#d050ff',
    placedBy: 'government',
    liveData: {
      production: 0.0,
      consumption: 250.0,
      status: 'online',
      efficiency: 98.0,
      uptime: 99.9
    },
    timestamp: 1719830000000
  },
  {
    id: 'hospital-1',
    type: 'hospital',
    name: 'Apollo Hospital',
    lon: 80.2570,
    lat: 13.0120,
    emoji: '🏥',
    color: '#ff0844',
    hologramColor: '#ff2060',
    placedBy: 'government',
    liveData: {
      production: 0.0,
      consumption: 600.0,
      status: 'online',
      efficiency: 99.0,
      uptime: 99.9
    },
    timestamp: 1719830000000
  },
  {
    id: 'hospital-2',
    type: 'hospital',
    name: 'MIOT Hospital',
    lon: 80.2080,
    lat: 13.0220,
    emoji: '🏥',
    color: '#ff0844',
    hologramColor: '#ff2060',
    placedBy: 'government',
    liveData: {
      production: 0.0,
      consumption: 450.0,
      status: 'online',
      efficiency: 98.0,
      uptime: 99.9
    },
    timestamp: 1719830000000
  },
  {
    id: 'school-1',
    type: 'school',
    name: 'IIT Madras',
    lon: 80.2340,
    lat: 12.9916,
    emoji: '🏫',
    color: '#4361ee',
    hologramColor: '#5080ff',
    placedBy: 'government',
    liveData: {
      production: 0.0,
      consumption: 200.0,
      status: 'online',
      efficiency: 94.0,
      uptime: 99.9
    },
    timestamp: 1719830000000
  },
  {
    id: 'school-2',
    type: 'school',
    name: 'Anna University',
    lon: 80.2345,
    lat: 13.0130,
    emoji: '🏫',
    color: '#4361ee',
    hologramColor: '#5080ff',
    placedBy: 'government',
    liveData: {
      production: 0.0,
      consumption: 150.0,
      status: 'online',
      efficiency: 93.0,
      uptime: 99.9
    },
    timestamp: 1719830000000
  },
  {
    id: 'commercial-1',
    type: 'commercial',
    name: 'Tidel Park IT',
    lon: 80.2335,
    lat: 12.9815,
    emoji: '🏢',
    color: '#ff6b35',
    hologramColor: '#ff8050',
    placedBy: 'government',
    liveData: {
      production: 0.0,
      consumption: 3500.0,
      status: 'online',
      efficiency: 96.0,
      uptime: 99.9
    },
    timestamp: 1719830000000
  },
  {
    id: 'commercial-2',
    type: 'commercial',
    name: 'SIPCOT IT Park',
    lon: 80.2260,
    lat: 12.9490,
    emoji: '🏢',
    color: '#ff6b35',
    hologramColor: '#ff8050',
    placedBy: 'government',
    liveData: {
      production: 0.0,
      consumption: 2800.0,
      status: 'online',
      efficiency: 95.0,
      uptime: 99.9
    },
    timestamp: 1719830000000
  },
  {
    id: 'substation-1',
    type: 'substation',
    name: 'Substation - Tondiarpet',
    lon: 80.2820,
    lat: 13.1140,
    emoji: '⚡',
    color: '#ffd700',
    hologramColor: '#ffe060',
    placedBy: 'government',
    liveData: {
      production: 0.0,
      consumption: 0.0,
      status: 'online',
      efficiency: 99.0,
      uptime: 99.9
    },
    timestamp: 1719830000000
  },
  {
    id: 'substation-2',
    type: 'substation',
    name: 'Substation - Tambaram',
    lon: 80.1180,
    lat: 12.9249,
    emoji: '⚡',
    color: '#ffd700',
    hologramColor: '#ffe060',
    placedBy: 'government',
    liveData: {
      production: 0.0,
      consumption: 0.0,
      status: 'online',
      efficiency: 98.0,
      uptime: 99.9
    },
    timestamp: 1719830000000
  },
  {
    id: 'residential-1',
    type: 'residential',
    name: 'Smart Colony - Velachery',
    lon: 80.2210,
    lat: 12.9790,
    emoji: '🏠',
    color: '#8892a4',
    hologramColor: '#a0b0c8',
    placedBy: 'government',
    liveData: {
      production: 0.0,
      consumption: 2500.0,
      status: 'online',
      efficiency: 92.0,
      uptime: 99.9
    },
    timestamp: 1719830000000
  },
  {
    id: 'residential-2',
    type: 'residential',
    name: 'Smart Colony - Mogappair',
    lon: 80.1800,
    lat: 13.0790,
    emoji: '🏠',
    color: '#8892a4',
    hologramColor: '#a0b0c8',
    placedBy: 'government',
    liveData: {
      production: 0.0,
      consumption: 1800.0,
      status: 'online',
      efficiency: 93.0,
      uptime: 99.9
    },
    timestamp: 1719830000000
  },
  {
    id: 'streetlight-1',
    type: 'streetlight',
    name: 'Smart Lights - Marina Beach Road',
    lon: 80.2790,
    lat: 13.0500,
    emoji: '💡',
    color: '#ffd700',
    hologramColor: '#fff3a0',
    placedBy: 'government',
    liveData: {
      production: 0.0,
      consumption: 2.0,
      status: 'online',
      efficiency: 99.0,
      uptime: 99.9
    },
    timestamp: 1719830000000
  }
];
