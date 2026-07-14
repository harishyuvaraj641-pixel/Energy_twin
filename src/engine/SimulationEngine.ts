// ─── Simulation Engine ──────────────────────────────────────────────────────
// Core engine that ties together weather, building demand, solar / wind
// generation, battery storage, and grid exchange into a single coherent
// simulation tick.  Designed to run at ~5 min simulated intervals.
// ─────────────────────────────────────────────────────────────────────────────

import { WeatherSimulator, type WeatherData } from './WeatherSimulator';
import { BuildingSimulator } from './BuildingSimulator';

// ─── Types ──────────────────────────────────────────────────────────────────

export interface SimulationData {
  /** ISO timestamp of the tick */
  timestamp: string;

  // ── Generation ──
  /** Solar PV output in kW */
  solarProduction: number;
  /** Wind turbine output in kW */
  windProduction: number;

  // ── Storage ──
  /** Battery state-of-charge 0-100 % */
  batteryLevel: number;
  /** True when battery is net charging */
  batteryCharging: boolean;

  // ── Demand ──
  /** Total city demand in kW */
  totalDemand: number;
  /** Residential demand in kW */
  residentialDemand: number;
  /** Commercial demand in kW */
  commercialDemand: number;
  /** Hospital demand in kW */
  hospitalDemand: number;
  /** School demand in kW */
  schoolDemand: number;
  /** EV charging stations demand in kW */
  evChargingDemand: number;

  // ── Grid ──
  /** Power imported from external grid in kW */
  gridImport: number;
  /** Power exported to external grid in kW */
  gridExport: number;

  // ── Metrics ──
  /** Percentage of demand met by renewables */
  renewablePercentage: number;
  /** Carbon saved this tick in kg CO₂ */
  carbonSaved: number;
  /** Cost savings this tick in ₹ */
  costSavings: number;

  // ── Weather ──
  temperature: number;
  cloudCover: number;
  windSpeed: number;
  rainProbability: number;
  humidity: number;

  // ── Time context ──
  /** Fractional hour 0-24 */
  timeOfDay: number;
  /** True on Saturday / Sunday */
  isWeekend: boolean;
}

// ─── Constants ──────────────────────────────────────────────────────────────

/** Peak solar nameplate capacity in kW */
const SOLAR_CAPACITY_KW = 5000;
/** Peak wind nameplate capacity in kW */
const WIND_CAPACITY_KW = 2000;
/** Battery total energy capacity in kWh */
const BATTERY_CAPACITY_KWH = 10000;
/** Maximum battery charge / discharge rate in kW */
const BATTERY_MAX_RATE_KW = 2000;
/** Grid carbon intensity – kg CO₂ per kWh */
const GRID_CARBON_INTENSITY = 0.82;
/** Grid electricity price ₹ / kWh */
const GRID_PRICE_PER_KWH = 8.5;
/** Feed-in tariff ₹ / kWh */
const FEED_IN_TARIFF_PER_KWH = 3.5;
/** Simulated interval in hours (5 minutes) */
const TICK_HOURS = 5 / 60;

// ─── Helpers ────────────────────────────────────────────────────────────────

const clamp = (v: number, min: number, max: number) =>
  Math.max(min, Math.min(max, v));

const round2 = (v: number) => Math.round(v * 100) / 100;

/** Gaussian bump: peaks at `center` with width `sigma`, returns 0-1. */
const bump = (x: number, center: number, sigma: number) =>
  Math.exp(-0.5 * ((x - center) / sigma) ** 2);

// ─── Engine ─────────────────────────────────────────────────────────────────

export class SimulationEngine {
  private weather: WeatherSimulator;
  private buildings: BuildingSimulator;

  /** Battery SOC in kWh (absolute) */
  private batteryEnergy: number;

  /** Internal simulated time — starts from current real time */
  private simTime: Date;

  /** Speed multiplier (1 = real-time 5-min ticks, higher = faster) */
  speed = 1;

  /** Whether the simulation is running */
  isRunning = true;

  constructor() {
    this.weather = new WeatherSimulator();
    this.buildings = new BuildingSimulator([
      'residential',
      'commercial',
      'hospital',
      'school',
    ]);
    this.batteryEnergy = BATTERY_CAPACITY_KWH * 0.5; // start at 50 %
    const start = new Date();
    start.setHours(10, 0, 0, 0); // Force initial simulated time to 10:00 AM (broad daylight)
    this.simTime = start;
  }

  public getSimulatedHour(): number {
    return this.simTime.getHours();
  }

  // ── Solar model ─────────────────────────────────────────────────────────

  private computeSolar(hour: number, cloudCover: number): number {
    // Bell curve peaking at solar noon (12:30)
    const solarCurve = bump(hour, 12.5, 3.2);
    // No output before 6 AM or after 6:30 PM
    if (hour < 6 || hour > 18.5) return 0;
    // Cloud attenuation: 0 % cloud → 100 % output, 100 % cloud → 15 % output
    const cloudFactor = 1 - (cloudCover / 100) * 0.85;
    const noise = 1 + (Math.random() * 2 - 1) * 0.03; // ±3 %
    return round2(SOLAR_CAPACITY_KW * solarCurve * cloudFactor * noise);
  }

  // ── Wind model ──────────────────────────────────────────────────────────

  private computeWind(hour: number, windSpeed: number): number {
    // Wind tends to be stronger at night; use a gentle cosine bias
    const diurnalBias = 1.15 + 0.15 * Math.cos(((hour - 3) / 24) * 2 * Math.PI);
    // Wind power ∝ v³ but we cap at rated
    const cubeRatio = Math.min(1, (windSpeed / 12) ** 3);
    // Cut-in at 3 m/s, cut-out at 25 m/s
    if (windSpeed < 3) return 0;
    if (windSpeed > 25) return 0;
    const noise = 1 + (Math.random() * 2 - 1) * 0.05; // ±5 %
    return round2(WIND_CAPACITY_KW * cubeRatio * diurnalBias * noise);
  }

  // ── EV charging model ───────────────────────────────────────────────────

  private computeEvCharging(hour: number, isWeekend: boolean): number {
    // Home charging: evening peak 6–11 PM
    const homeCharging = bump(hour, 21, 2.5) * 350;
    // Workplace charging: 9 AM – 5 PM weekdays
    const workCharging = isWeekend ? 0 : bump(hour, 12, 3) * 250;
    // Fast chargers: small constant + daytime bump
    const fastCharging = 50 + bump(hour, 14, 4) * 100;
    const noise = 1 + (Math.random() * 2 - 1) * 0.08;
    return round2((homeCharging + workCharging + fastCharging) * noise);
  }

  // ── Main tick ───────────────────────────────────────────────────────────

  /**
   * Advance the simulation by one step.
   * Returns the full state snapshot for this tick.
   */
  tick(multipliers?: {
    solar: number;
    wind: number;
    battery: number;
    ev: number;
    hospital: number;
    school: number;
    commercial: number;
    residential: number;
  }): SimulationData {
    const solarM = multipliers ? multipliers.solar : 1;
    const windM = multipliers ? multipliers.wind : 1;
    const batteryM = multipliers ? multipliers.battery : 1;
    const evM = multipliers ? multipliers.ev : 1;
    const hospitalM = multipliers ? multipliers.hospital : 1;
    const schoolM = multipliers ? multipliers.school : 1;
    const commercialM = multipliers ? multipliers.commercial : 1;
    const residentialM = multipliers ? multipliers.residential : 1;

    // Advance simulated clock
    this.simTime = new Date(
      this.simTime.getTime() + TICK_HOURS * 60 * 60 * 1000 * this.speed,
    );

    const now = this.simTime;
    const hour = now.getHours() + now.getMinutes() / 60;
    const dayOfWeek = now.getDay(); // 0=Sun, 6=Sat
    const isWeekend = dayOfWeek === 0 || dayOfWeek === 6;

    // ── Weather ───────────────────────────────────────────────────────
    const w: WeatherData = this.weather.update(now);

    // ── Generation ────────────────────────────────────────────────────
    const solarProduction = round2(this.computeSolar(hour, w.cloudCover) * solarM);
    const windProduction = round2(this.computeWind(hour, w.windSpeed) * windM);
    const totalGeneration = solarProduction + windProduction;

    // ── Demand ────────────────────────────────────────────────────────
    const residentialDemand = round2(
      this.buildings.getDemandByType('residential', hour, isWeekend) * residentialM,
    );
    const commercialDemand = round2(
      this.buildings.getDemandByType('commercial', hour, isWeekend) * commercialM,
    );
    const hospitalDemand = round2(
      this.buildings.getDemandByType('hospital', hour, isWeekend) * hospitalM,
    );
    const schoolDemand = round2(
      this.buildings.getDemandByType('school', hour, isWeekend) * schoolM,
    );
    const evChargingDemand = round2(this.computeEvCharging(hour, isWeekend) * evM);
    const totalDemand = round2(
      residentialDemand +
        commercialDemand +
        hospitalDemand +
        schoolDemand +
        evChargingDemand,
    );

    // ── Battery dispatch ──────────────────────────────────────────────
    const surplus = totalGeneration - totalDemand; // positive = excess generation
    let batteryPower = 0; // positive = charging, negative = discharging
    let gridImport = 0;
    let gridExport = 0;

    const activeCapacity = BATTERY_CAPACITY_KWH * batteryM;
    const activeMaxRate = BATTERY_MAX_RATE_KW * batteryM;

    if (surplus > 0) {
      // Excess energy → charge battery first, then export
      const maxCharge = Math.min(
        surplus,
        activeMaxRate,
        ((activeCapacity - this.batteryEnergy) / TICK_HOURS),
      );
      batteryPower = maxCharge;
      const remaining = surplus - maxCharge;
      gridExport = round2(remaining);
    } else {
      // Deficit → discharge battery first, then import
      const deficit = Math.abs(surplus);
      const maxDischarge = Math.min(
        deficit,
        activeMaxRate,
        (this.batteryEnergy / TICK_HOURS),
      );
      batteryPower = -maxDischarge;
      const remaining = deficit - maxDischarge;
      gridImport = round2(remaining);
    }

    // Update battery SOC
    this.batteryEnergy = clamp(
      this.batteryEnergy + batteryPower * TICK_HOURS,
      0,
      activeCapacity,
    );

    const batteryLevel = round2(
      activeCapacity > 0 ? (this.batteryEnergy / activeCapacity) * 100 : 0,
    );
    const batteryCharging = batteryPower > 0;

    // ── Metrics ───────────────────────────────────────────────────────
    const renewableUsed = Math.min(totalGeneration, totalDemand);
    const renewablePercentage =
      totalDemand > 0 ? round2((renewableUsed / totalDemand) * 100) : 0;

    // Carbon saved = renewable kWh that displaced grid kWh
    const renewableEnergy = renewableUsed * TICK_HOURS;
    const carbonSaved = round2(renewableEnergy * GRID_CARBON_INTENSITY);

    // Cost savings = avoided import cost − feed-in revenue foregone
    const avoidedImportCost = renewableEnergy * GRID_PRICE_PER_KWH;
    const exportRevenue = gridExport * TICK_HOURS * FEED_IN_TARIFF_PER_KWH;
    const costSavings = round2(avoidedImportCost + exportRevenue);

    return {
      timestamp: now.toISOString(),
      solarProduction,
      windProduction,
      batteryLevel,
      batteryCharging,
      totalDemand,
      residentialDemand,
      commercialDemand,
      hospitalDemand,
      schoolDemand,
      evChargingDemand,
      gridImport,
      gridExport,
      renewablePercentage: clamp(renewablePercentage, 0, 100),
      carbonSaved,
      costSavings,
      temperature: w.temperature,
      cloudCover: w.cloudCover,
      windSpeed: w.windSpeed,
      rainProbability: w.rainProbability,
      humidity: w.humidity,
      timeOfDay: round2(hour),
      isWeekend,
    };
  }

  /** Reset engine to initial state. */
  reset(): void {
    this.weather.reset();
    this.batteryEnergy = BATTERY_CAPACITY_KWH * 0.5;
    this.simTime = new Date();
  }

  /** Get current battery energy in kWh. */
  getBatteryEnergy(): number {
    return round2(this.batteryEnergy);
  }

  /** Get battery capacity in kWh. */
  getBatteryCapacity(): number {
    return BATTERY_CAPACITY_KWH;
  }
}

/** Singleton instance for app-wide use. */
const simulationEngine = new SimulationEngine();
export default simulationEngine;
