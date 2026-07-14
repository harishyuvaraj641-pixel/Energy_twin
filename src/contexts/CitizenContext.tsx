// ─── Citizen Microgrid Context ──────────────────────────────────────────────
// Shares the real-time simulation state of the 3D House Twin with all tabs
// of the Citizen Portal. Generates consistent, live simulation-driven data
// for Overview, Energy Usage charts, EV calculations, Carbon offsets, and Leaderboards.
// ─────────────────────────────────────────────────────────────────────────────

import React, { createContext, useContext, useState, useMemo, useEffect } from 'react';
import * as THREE from 'three';

type RoofFace = 'South' | 'North' | 'East' | 'West';

interface DailyDataPoint {
  date: string;
  usage: number;
  solar: number;
}

interface WeeklyDataPoint {
  week: string;
  usage: number;
  solar: number;
}

interface MonthlyDataPoint {
  month: string;
  usage: number;
  solar: number;
}

interface ComparisonItem {
  category: string;
  you: number;
  neighborhood: number;
}

interface ApplianceItem {
  name: string;
  value: number;
  color: string;
}

interface CitizenContextType {
  // Main states
  timeOfDay: number;
  setTimeOfDay: (t: number) => void;
  selectedFace: RoofFace;
  setSelectedFace: (f: RoofFace) => void;
  evEnabled: boolean;
  setEvEnabled: (b: boolean) => void;
  hvacEnabled: boolean;
  setHvacEnabled: (b: boolean) => void;
  lightsOn: boolean;
  setLightsOn: (b: boolean) => void;
  targetTemp: number;
  setTargetTemp: (t: number) => void;
  solarCapacity: number; // 1 kW to 10 kW
  setSolarCapacity: (c: number) => void;
  batteryEnabled: boolean;
  setBatteryEnabled: (b: boolean) => void;
  isSimulating: boolean;
  setIsSimulating: (b: boolean) => void;
  
  // Base configuration
  roofArea: number;
  setRoofArea: (a: number) => void;
  budget: number;
  setBudget: (b: number) => void;
  baselineBill: number;
  setBaselineBill: (b: number) => void;
  
  // Real-time computed values
  efficiencyScore: number;
  paybackYears: number;
  totalDemand: number;
  solarOutput: number;
  netPower: number;
  monthlyBill: number;
  co2Offset: number;
  solarIrradiance: number;
  ratePerKWh: number;

  // Real-time generated datasets
  dailyData: DailyDataPoint[];
  weeklyData: WeeklyDataPoint[];
  monthlyData: MonthlyDataPoint[];
  comparisonData: ComparisonItem[];
  applianceData: ApplianceItem[];
  hourlyRateData: { hour: string; rate: number }[];
}

const CitizenContext = createContext<CitizenContextType | undefined>(undefined);

const roofNormals: Record<RoofFace, THREE.Vector3> = {
  South: new THREE.Vector3(0, 0.707, 0.707).normalize(),
  North: new THREE.Vector3(0, 0.707, -0.707).normalize(),
  East: new THREE.Vector3(0.707, 0.707, 0).normalize(),
  West: new THREE.Vector3(-0.707, 0.707, 0).normalize(),
};

const orientationFactors: Record<RoofFace, number> = {
  South: 1.0,
  East: 0.85,
  West: 0.85,
  North: 0.65,
};

export const CitizenProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  // Real-time house states
  const [timeOfDay, setTimeOfDay] = useState<number>(10.5);
  const [selectedFace, setSelectedFace] = useState<RoofFace>('South');
  const [evEnabled, setEvEnabled] = useState<boolean>(false);
  const [hvacEnabled, setHvacEnabled] = useState<boolean>(false);
  const [lightsOn, setLightsOn] = useState<boolean>(true);
  const [targetTemp, setTargetTemp] = useState<number>(23); // Default cooling target 23°C
  const [solarCapacity, setSolarCapacity] = useState<number>(5.0); // Default 5.0 kW peak
  const [batteryEnabled, setBatteryEnabled] = useState<boolean>(false);
  const [isSimulating, setIsSimulating] = useState<boolean>(true);

  // Auto-advance simulated time
  useEffect(() => {
    if (!isSimulating) return;
    const interval = setInterval(() => {
      setTimeOfDay((prev) => {
        const next = prev + 0.1; // advance 6 minutes of simulated time per second
        return next >= 24 ? 0 : parseFloat(next.toFixed(2));
      });
    }, 1000);
    return () => clearInterval(interval);
  }, [isSimulating]);

  // Solar estimator states
  const [roofArea, setRoofArea] = useState<number>(100);
  const [budget, setBudget] = useState<number>(500000);
  const [baselineBill, setBaselineBill] = useState<number>(5000);

  const solarIrradiance = 5.5; // kWh/m²/day for Chennai
  const ratePerKWh = 8.5; // base rate per kWh

  // ─── Mathematical Computations & State Sync ────────────────────────────────
  const calculations = useMemo(() => {
    // 1. Sun direction
    const angle = ((timeOfDay - 6) / 24) * 2 * Math.PI;
    const x = Math.cos(angle);
    const y = Math.sin(angle); // Day when y > 0
    const z = 0.25; 
    const sunDir = new THREE.Vector3(x, y, z).normalize();

    // 2. Solar orientation dot product efficiency
    const panelNormal = roofNormals[selectedFace];
    const dot = sunDir.dot(panelNormal);
    const efficiency = y > 0 ? Math.max(0, dot) : 0;
    const efficiencyScore = Math.round(efficiency * 100);

    // 3. Solar Output (real-time in kW)
    const solarOutput = solarCapacity * efficiency;

    // 4. Real-time household demand loads
    const baseDemand = 0.5; // 500W critical base load
    const lightsDemand = lightsOn ? 0.3 : 0; // 300W lighting load
    const hvacDemand = hvacEnabled ? Math.max(1.0, (28 - targetTemp) * 0.6) : 0; // scaled by thermostat delta
    const evDemand = evEnabled ? 7.0 : 0; // 7kW Level-2 fast charger
    const totalDemand = baseDemand + lightsDemand + hvacDemand + evDemand;

    // 5. Net Power Balance
    const netPower = solarOutput - totalDemand;

    // ─── Dataset Generator: Daily (30 days) ──────────────────────────────────
    const dailyData: DailyDataPoint[] = [];
    const now = new Date();
    
    // Model daily averages based on selected states
    const avgDailyUsage = baseDemand * 24 + lightsDemand * 8 + hvacDemand * 7 + evDemand * 2.5;
    const avgDailySolar = solarCapacity * solarIrradiance * 0.82 * (orientationFactors[selectedFace] || 1.0);

    for (let i = 29; i >= 0; i--) {
      const date = new Date(now);
      date.setDate(date.getDate() - i);
      // Add slight noise variations (weather, weekday load shifts)
      const dayIndex = date.getDate();
      const noiseDemand = 0.92 + Math.sin(dayIndex * 0.8) * 0.08;
      const noiseSolar = 0.85 + Math.cos(dayIndex * 0.5) * 0.15;

      dailyData.push({
        date: date.toLocaleDateString('en-IN', { day: '2-digit', month: 'short' }),
        usage: parseFloat((avgDailyUsage * noiseDemand).toFixed(1)),
        solar: parseFloat((avgDailySolar * noiseSolar).toFixed(1)),
      });
    }

    // ─── Dataset Generator: Weekly (4 weeks) ─────────────────────────────────
    const weeklyData: WeeklyDataPoint[] = Array.from({ length: 4 }).map((_, idx) => {
      const weekIndex = idx + 1;
      const noiseDemand = 0.95 + Math.sin(weekIndex) * 0.05;
      const noiseSolar = 0.9 + Math.cos(weekIndex * 2) * 0.1;
      return {
        week: `Week ${weekIndex}`,
        usage: parseFloat((avgDailyUsage * 7 * noiseDemand).toFixed(1)),
        solar: parseFloat((avgDailySolar * 7 * noiseSolar).toFixed(1)),
      };
    });

    // ─── Dataset Generator: Monthly (12 months) ──────────────────────────────
    // Incorporate Chennai monsoon variations (heavy rain in Nov/Dec drops solar)
    const monthlySolarIrradiance: Record<number, number> = {
      0: 5.2, 1: 5.8, 2: 6.2, 3: 6.0, 4: 5.7, 5: 5.3, // Jan - Jun
      6: 5.1, 7: 5.2, 8: 5.4, 9: 4.8, 10: 3.6, 11: 4.0, // Jul - Dec (Nov is lowest at 3.6)
    };

    const monthNames = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
    const monthlyData: MonthlyDataPoint[] = monthNames.map((name, idx) => {
      const irradianceFactor = monthlySolarIrradiance[idx] / solarIrradiance;
      const monthlySolar = solarCapacity * monthlySolarIrradiance[idx] * 30 * 0.82 * (orientationFactors[selectedFace] || 1.0);
      const monthlyUsage = avgDailyUsage * 30 * (1.0 + (idx >= 4 && idx <= 8 ? 0.2 : 0)); // AC peaks in summer May-Aug

      return {
        month: name,
        usage: Math.round(monthlyUsage),
        solar: Math.round(monthlySolar),
      };
    });

    // ─── Monthly aggregates & financial offsets ──────────────────────────────
    const currentMonthGen = avgDailySolar * 30;
    const currentMonthDemand = avgDailyUsage * 30;

    const baseBill = currentMonthDemand * ratePerKWh;
    const solarSavings = currentMonthGen * ratePerKWh;
    // Calculate final billing with battery load shifts if enabled (saves an extra 10%)
    const batteryMultiplier = batteryEnabled ? 0.88 : 1.0;
    const monthlyBill = Math.round(Math.max(0, (baseBill - solarSavings) * batteryMultiplier));

    // Payback period
    const installCost = solarCapacity * 55000; // ₹55k per kW peak
    const monthlySavings = Math.min(currentMonthGen * ratePerKWh, baseBill * 0.9) * (batteryEnabled ? 1.1 : 1.0);
    const paybackYears = monthlySavings > 0 
      ? parseFloat((installCost / (monthlySavings * 12)).toFixed(1))
      : 20.0;

    // CO2 savings: 0.82 kg offset per clean kWh generated
    const co2Offset = parseFloat(((currentMonthGen * 0.82)).toFixed(1));

    // ─── Comparison Data (You vs Neighborhood Average) ───────────────────────
    const comparisonData: ComparisonItem[] = [
      { category: 'Electricity', you: Math.round(currentMonthDemand), neighborhood: 350 },
      { category: 'Peak Hours', you: Math.round(hvacDemand * 7 * 30 + baseDemand * 4 * 30), neighborhood: 180 },
      { category: 'Off-Peak', you: Math.round(evDemand * 2.5 * 30 + baseDemand * 20 * 30), neighborhood: 170 },
      { category: 'Solar Used', you: Math.round(currentMonthGen), neighborhood: 60 },
    ];

    // ─── Appliance Breakdown ─────────────────────────────────────────────────
    const hvacTotal = hvacDemand * 7;
    const lightsTotal = lightsDemand * 8;
    const evTotal = evEnabled ? evDemand * 2.5 : 0;
    const baseTotal = baseDemand * 24;
    const overallTotal = hvacTotal + lightsTotal + evTotal + baseTotal;

    const applianceData: ApplianceItem[] = [
      { name: 'AC / Cooling', value: Math.round((hvacTotal / overallTotal) * 100) || 0, color: '#00f5ff' },
      { name: 'Kitchen', value: 15, color: '#ff6b35' }, // baseline mock
      { name: 'Lighting', value: Math.round((lightsTotal / overallTotal) * 100) || 0, color: '#ffd700' },
      { name: 'EV Charger', value: Math.round((evTotal / overallTotal) * 100) || 0, color: '#bf00ff' },
      { name: 'Electronics & Others', value: Math.round((baseTotal / overallTotal) * 100) || 0, color: '#39ff14' },
    ].filter(a => a.value > 0);

    // ─── Pricing Curve for EV Charging ───────────────────────────────────────
    const hourlyRateData = Array.from({ length: 24 }).map((_, hr) => {
      let rate = 8.5; // default normal
      if ((hr >= 6 && hr <= 10) || (hr >= 18 && hr <= 22)) {
        rate = 10.5; // peak hours
      } else if (hr >= 22 || hr < 5) {
        rate = 4.5; // super off-peak
      }
      return {
        hour: `${hr.toString().padStart(2, '0')}:00`,
        rate,
      };
    });

    return {
      efficiencyScore,
      paybackYears,
      totalDemand: Math.round(totalDemand * 10) / 10,
      solarOutput: Math.round(solarOutput * 10) / 10,
      netPower: Math.round(netPower * 10) / 10,
      monthlyBill,
      co2Offset,
      dailyData,
      weeklyData,
      monthlyData,
      comparisonData,
      applianceData,
      hourlyRateData,
    };
  }, [timeOfDay, selectedFace, evEnabled, hvacEnabled, lightsOn, targetTemp, solarCapacity, batteryEnabled, roofArea, budget, baselineBill]);

  return (
    <CitizenContext.Provider
      value={{
        timeOfDay,
        setTimeOfDay,
        selectedFace,
        setSelectedFace,
        evEnabled,
        setEvEnabled,
        hvacEnabled,
        setHvacEnabled,
        lightsOn,
        setLightsOn,
        targetTemp,
        setTargetTemp,
        solarCapacity,
        setSolarCapacity,
        batteryEnabled,
        setBatteryEnabled,
        isSimulating,
        setIsSimulating,
        roofArea,
        setRoofArea,
        budget,
        setBudget,
        baselineBill,
        setBaselineBill,
        efficiencyScore: calculations.efficiencyScore,
        paybackYears: calculations.paybackYears,
        totalDemand: calculations.totalDemand,
        solarOutput: calculations.solarOutput,
        netPower: calculations.netPower,
        monthlyBill: calculations.monthlyBill,
        co2Offset: calculations.co2Offset,
        solarIrradiance,
        ratePerKWh,
        dailyData: calculations.dailyData,
        weeklyData: calculations.weeklyData,
        monthlyData: calculations.monthlyData,
        comparisonData: calculations.comparisonData,
        applianceData: calculations.applianceData,
        hourlyRateData: calculations.hourlyRateData,
      }}
    >
      {children}
    </CitizenContext.Provider>
  );
};

export const useCitizen = () => {
  const context = useContext(CitizenContext);
  if (!context) {
    throw new Error('useCitizen must be used within a CitizenProvider');
  }
  return context;
};
