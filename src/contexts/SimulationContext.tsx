// ─── Simulation Context ─────────────────────────────────────────────────────
// Wraps the SimulationEngine and exposes its live output via React context.
// The engine ticks every 3 seconds and keeps a rolling history buffer of the
// last 288 data points (= 24 hours at 5-minute simulated intervals).
// ─────────────────────────────────────────────────────────────────────────────

import {
  createContext,
  useContext,
  useState,
  useEffect,
  useRef,
  useCallback,
  type ReactNode,
} from 'react';

import simulationEngine, {
  SimulationEngine,
  type SimulationData,
} from '../engine/SimulationEngine';
import type { WeatherData } from '../engine/WeatherSimulator';
import { type PlacedAsset, generateAssetData, INITIAL_CITY_ASSETS } from '../engine/OverlayAssetTypes';

// ─── Constants ──────────────────────────────────────────────────────────────

/** How often the engine ticks in ms. */
const TICK_INTERVAL_MS = 3000;

/** Maximum history length – 288 × 5 min = 24 h. */
const MAX_HISTORY_LENGTH = 288;

// ─── Context shape ──────────────────────────────────────────────────────────

interface SimulationContextValue {
  /** Latest simulation snapshot. */
  currentData: SimulationData | null;
  /** Rolling history buffer (oldest → newest). */
  historyData: SimulationData[];
  /** Latest weather summary extracted from current tick. */
  weatherData: WeatherData | null;
  /** Whether the simulation loop is running. */
  isRunning: boolean;
  /** Current speed multiplier. */
  speed: number;
  /** Change the speed multiplier (1 = real-time). */
  setSpeed: (speed: number) => void;
  /** Pause / resume the simulation. */
  toggleSimulation: () => void;
  /** User placed overlay assets */
  placedAssets: PlacedAsset[];
  /** State setter for user placed overlay assets */
  setPlacedAssets: React.Dispatch<React.SetStateAction<PlacedAsset[]>>;
}

const SimulationContext = createContext<SimulationContextValue | undefined>(
  undefined,
);

// ─── Provider ───────────────────────────────────────────────────────────────

interface SimulationProviderProps {
  children: ReactNode;
}

export function SimulationProvider({ children }: SimulationProviderProps) {
  const engineRef = useRef<SimulationEngine>(simulationEngine);

  const [currentData, setCurrentData] = useState<SimulationData | null>(null);
  const [historyData, setHistoryData] = useState<SimulationData[]>([]);
  const [weatherData, setWeatherData] = useState<WeatherData | null>(null);
  const [isRunning, setIsRunning] = useState(true);
  const [speed, setSpeedState] = useState(1);

  // User-placed assets initialized with base city assets
  const [placedAssets, setPlacedAssets] = useState<PlacedAsset[]>(INITIAL_CITY_ASSETS);
  const placedAssetsRef = useRef<PlacedAsset[]>(INITIAL_CITY_ASSETS);
  const batteryEnergyRef = useRef<number>(0);

  useEffect(() => {
    placedAssetsRef.current = placedAssets;
  }, [placedAssets]);

  // ── Speed setter ────────────────────────────────────────────────────────

  const setSpeed = useCallback((newSpeed: number) => {
    const clamped = Math.max(0.25, Math.min(newSpeed, 16));
    engineRef.current.speed = clamped;
    setSpeedState(clamped);
  }, []);

  // ── Toggle ──────────────────────────────────────────────────────────────

  const toggleSimulation = useCallback(() => {
    setIsRunning((prev) => {
      const next = !prev;
      engineRef.current.isRunning = next;
      return next;
    });
  }, []);

  // ── Tick loop ───────────────────────────────────────────────────────────

  useEffect(() => {
    if (!isRunning) return;

    // Run one immediate tick so the UI doesn't start empty
    const doTick = () => {
      const currentHour = engineRef.current.getSimulatedHour();
      const assets = placedAssetsRef.current;

      // Dynamically compute and store live telemetry for each placed asset matching the simulated hour!
      const updatedAssets = assets.map((asset) => ({
        ...asset,
        liveData: generateAssetData(asset.type, currentHour),
      }));

      // Commit updated assets with correct simulated live telemetries to context state
      setPlacedAssets(updatedAssets);

      // Filter and sum generation
      let solarProduction = 0;
      let windProduction = 0;
      let residentialDemand = 0;
      let commercialDemand = 0;
      let hospitalDemand = 0;
      let schoolDemand = 0;
      let evChargingDemand = 0;
      let streetlightDemand = 0;

      // Battery variables
      let totalBatteryCapacity = 0;
      let totalMaxBatteryRate = 0;

      updatedAssets.forEach((asset) => {
        if (asset.type === 'solar') {
          solarProduction += asset.liveData.production;
        } else if (asset.type === 'wind') {
          windProduction += asset.liveData.production;
        } else if (asset.type === 'residential') {
          residentialDemand += asset.liveData.consumption;
        } else if (asset.type === 'commercial') {
          commercialDemand += asset.liveData.consumption;
        } else if (asset.type === 'hospital') {
          hospitalDemand += asset.liveData.consumption;
        } else if (asset.type === 'school') {
          schoolDemand += asset.liveData.consumption;
        } else if (asset.type === 'ev') {
          evChargingDemand += asset.liveData.consumption;
        } else if (asset.type === 'streetlight') {
          streetlightDemand += asset.liveData.consumption;
        } else if (asset.type === 'battery') {
          totalBatteryCapacity += 5000; // 5000 kWh per battery
          totalMaxBatteryRate += 1000;   // 1000 kW rate
        }
      });

      const totalGeneration = solarProduction + windProduction;
      const totalDemand =
        residentialDemand +
        commercialDemand +
        hospitalDemand +
        schoolDemand +
        evChargingDemand +
        streetlightDemand;

      // Tick the underlying engine with 0 multipliers to advance time and weather, but ignore base outputs
      const baseTickData = engineRef.current.tick({
        solar: 0,
        wind: 0,
        battery: 0,
        ev: 0,
        hospital: 0,
        school: 0,
        commercial: 0,
        residential: 0,
      });

      // Calculate battery dispatch
      const surplus = totalGeneration - totalDemand;
      let batteryPower = 0;
      let gridImport = 0;
      let gridExport = 0;

      const TICK_HOURS = 5 / 60;
      if (totalBatteryCapacity > 0) {
        if (surplus > 0) {
          const maxCharge = Math.min(
            surplus,
            totalMaxBatteryRate,
            (totalBatteryCapacity - batteryEnergyRef.current) / TICK_HOURS,
          );
          batteryPower = maxCharge;
          gridExport = surplus - maxCharge;
        } else {
          const deficit = Math.abs(surplus);
          const maxDischarge = Math.min(
            deficit,
            totalMaxBatteryRate,
            batteryEnergyRef.current / TICK_HOURS,
          );
          batteryPower = -maxDischarge;
          gridImport = deficit - maxDischarge;
        }
        batteryEnergyRef.current = Math.max(
          0,
          Math.min(totalBatteryCapacity, batteryEnergyRef.current + batteryPower * TICK_HOURS),
        );
      } else {
        batteryEnergyRef.current = 0;
        if (surplus > 0) {
          gridExport = surplus;
        } else {
          gridImport = Math.abs(surplus);
        }
      }

      const batteryLevel =
        totalBatteryCapacity > 0 ? (batteryEnergyRef.current / totalBatteryCapacity) * 100 : 0;
      const batteryCharging = batteryPower > 0;

      // Metrics
      const renewableUsed = Math.min(totalGeneration, totalDemand);
      const renewablePercentage = totalDemand > 0 
        ? (renewableUsed / totalDemand) * 100 
        : (totalGeneration > 0 ? 100 : 0);

      const GRID_CARBON_INTENSITY = 0.82;
      const GRID_PRICE_PER_KWH = 8.5;
      const FEED_IN_TARIFF_PER_KWH = 3.5;

      // Carbon is saved by total clean energy generated (both locally consumed & exported grid displacement)
      const carbonSaved = totalGeneration * TICK_HOURS * GRID_CARBON_INTENSITY;
      const avoidedImportCost = renewableUsed * TICK_HOURS * GRID_PRICE_PER_KWH;
      const exportRevenue = gridExport * TICK_HOURS * FEED_IN_TARIFF_PER_KWH;
      const costSavings = avoidedImportCost + exportRevenue;

      const dynamicData: SimulationData = {
        timestamp: baseTickData.timestamp,
        solarProduction: Math.round(solarProduction * 100) / 100,
        windProduction: Math.round(windProduction * 100) / 100,
        batteryLevel: Math.round(batteryLevel * 100) / 100,
        batteryCharging,
        totalDemand: Math.round(totalDemand * 100) / 100,
        residentialDemand: Math.round(residentialDemand * 100) / 100,
        commercialDemand: Math.round(commercialDemand * 100) / 100,
        hospitalDemand: Math.round(hospitalDemand * 100) / 100,
        schoolDemand: Math.round(schoolDemand * 100) / 100,
        evChargingDemand: Math.round(evChargingDemand * 100) / 100,
        gridImport: Math.round(gridImport * 100) / 100,
        gridExport: Math.round(gridExport * 100) / 100,
        renewablePercentage: Math.round(Math.min(100, renewablePercentage) * 100) / 100,
        carbonSaved: Math.round(carbonSaved * 100) / 100,
        costSavings: Math.round(costSavings * 100) / 100,
        temperature: baseTickData.temperature,
        cloudCover: baseTickData.cloudCover,
        windSpeed: baseTickData.windSpeed,
        rainProbability: baseTickData.rainProbability,
        humidity: baseTickData.humidity,
        timeOfDay: baseTickData.timeOfDay,
        isWeekend: baseTickData.isWeekend,
      };

      setCurrentData(dynamicData);

      setHistoryData((prev) => {
        const next = [...prev, dynamicData];
        return next.length > MAX_HISTORY_LENGTH
          ? next.slice(next.length - MAX_HISTORY_LENGTH)
          : next;
      });

      setWeatherData({
        temperature: baseTickData.temperature,
        cloudCover: baseTickData.cloudCover,
        windSpeed: baseTickData.windSpeed,
        rainProbability: baseTickData.rainProbability,
        humidity: baseTickData.humidity,
        condition:
          baseTickData.rainProbability > 70 && baseTickData.windSpeed > 10
            ? 'stormy'
            : baseTickData.rainProbability > 45
              ? 'rainy'
              : baseTickData.cloudCover > 55
                ? 'cloudy'
                : 'sunny',
      });
    };

    // Immediate first tick
    doTick();

    const id = setInterval(doTick, TICK_INTERVAL_MS);
    return () => clearInterval(id);
  }, [isRunning]);

  // ── Context value ───────────────────────────────────────────────────────

  const value: SimulationContextValue = {
    currentData,
    historyData,
    weatherData,
    isRunning,
    speed,
    setSpeed,
    toggleSimulation,
    placedAssets,
    setPlacedAssets,
  };

  return (
    <SimulationContext.Provider value={value}>
      {children}
    </SimulationContext.Provider>
  );
}

// ─── Hook ───────────────────────────────────────────────────────────────────

/**
 * Access the simulation state from any component below `<SimulationProvider>`.
 * Throws if used outside the provider tree.
 */
export function useSimulation(): SimulationContextValue {
  const ctx = useContext(SimulationContext);
  if (ctx === undefined) {
    throw new Error(
      'useSimulation must be used within a <SimulationProvider>',
    );
  }
  return ctx;
}

export default SimulationProvider;
