// ─── Building Demand Simulator ──────────────────────────────────────────────
// Generates realistic electricity demand curves for different building types
// in a smart city.  Each profile is shaped by time-of-day and weekday vs
// weekend schedules, with ±10 % random noise for realism.
// ─────────────────────────────────────────────────────────────────────────────

export type BuildingType =
  | 'residential'
  | 'commercial'
  | 'hospital'
  | 'school'
  | 'industrial';

export interface BuildingProfile {
  /** Building category */
  type: BuildingType;
  /** Base power draw in kW (nameplate / peak) */
  baseLoad: number;
  /** Return instantaneous demand in kW for the given hour and day type. */
  getDemand: (hour: number, isWeekend: boolean) => number;
}

// ─── Helpers ────────────────────────────────────────────────────────────────

/** Add ±10 % uniform noise. */
const addNoise = (value: number, pct = 0.1): number => {
  const noise = 1 + (Math.random() * 2 - 1) * pct;
  return value * noise;
};

/**
 * Gaussian-like bump centered at `center` with width `sigma`.
 * Returns a value in [0, 1] for weighting demand curves.
 */
const bump = (hour: number, center: number, sigma: number): number =>
  Math.exp(-0.5 * ((hour - center) / sigma) ** 2);

// ─── Profile factories ─────────────────────────────────────────────────────

/**
 * Residential – 800 kW base.
 * Morning peak (7-9 AM): cooking, hot water, getting ready.
 * Evening peak (6-10 PM): cooking, lighting, entertainment.
 * Overnight trough.
 */
const createResidential = (): BuildingProfile => ({
  type: 'residential',
  baseLoad: 800,
  getDemand(hour: number, _isWeekend: boolean): number {
    const base = 800;
    const morningPeak = bump(hour, 8, 1.2) * 500;   // +500 kW at 8 AM
    const eveningPeak = bump(hour, 20, 2.0) * 650;  // +650 kW at 8 PM
    const nightDip = hour >= 0 && hour < 5 ? -300 : 0;
    // Weekends: slightly higher daytime (people at home)
    const weekendBoost = _isWeekend ? bump(hour, 13, 3) * 150 : 0;
    return addNoise(Math.max(200, base + morningPeak + eveningPeak + nightDip + weekendBoost));
  },
});

/**
 * Commercial – 1 500 kW base.
 * Active 8 AM – 8 PM on weekdays; HVAC ramp from 7 AM.
 * Weekends drop to ~30 % (security, servers, minimal HVAC).
 */
const createCommercial = (): BuildingProfile => ({
  type: 'commercial',
  baseLoad: 1500,
  getDemand(hour: number, isWeekend: boolean): number {
    if (isWeekend) {
      // Skeleton load
      return addNoise(450 + bump(hour, 13, 4) * 200);
    }
    const rampUp = bump(hour, 9, 1.5) * 400;    // morning ramp
    const plateau = hour >= 9 && hour <= 17 ? 1500 : 300;
    const rampDown = bump(hour, 18, 1.5) * 350;  // evening tail
    return addNoise(Math.max(250, plateau + rampUp + rampDown));
  },
});

/**
 * Hospital – 600 kW constant (critical load).
 * Hospitals run 24 / 7 with very little variation.
 * Slight bump during daytime due to surgeries & outpatient activity.
 */
const createHospital = (): BuildingProfile => ({
  type: 'hospital',
  baseLoad: 600,
  getDemand(hour: number, _isWeekend: boolean): number {
    const base = 600;
    const daytimeSurge = bump(hour, 12, 4) * 120; // surgeries & outpatient
    const nightReduction = hour >= 23 || hour < 5 ? -60 : 0;
    return addNoise(Math.max(480, base + daytimeSurge + nightReduction), 0.05); // tighter noise for critical
  },
});

/**
 * School – 400 kW, active 7 AM – 4 PM weekdays only.
 * Zero (or near-zero) on weekends and after hours.
 */
const createSchool = (): BuildingProfile => ({
  type: 'school',
  baseLoad: 400,
  getDemand(hour: number, isWeekend: boolean): number {
    if (isWeekend) {
      return addNoise(30); // security lighting
    }
    if (hour < 7 || hour > 16) {
      return addNoise(30);
    }
    // Bell curve over the school day
    const activity = bump(hour, 11, 3) * 400;
    return addNoise(Math.max(30, 80 + activity));
  },
});

/**
 * Industrial – 2 000 kW base.
 * Runs 24 / 7 with a slight dip on weekends (~85 %).
 * Small overnight reduction for non-continuous processes.
 */
const createIndustrial = (): BuildingProfile => ({
  type: 'industrial',
  baseLoad: 2000,
  getDemand(hour: number, isWeekend: boolean): number {
    const base = isWeekend ? 1700 : 2000;
    const nightDip = hour >= 0 && hour < 6 ? -200 : 0;
    const dayBoost = bump(hour, 13, 4) * 250;
    return addNoise(Math.max(800, base + nightDip + dayBoost));
  },
});

// ─── Profile registry ───────────────────────────────────────────────────────

const profileFactories: Record<BuildingType, () => BuildingProfile> = {
  residential: createResidential,
  commercial: createCommercial,
  hospital: createHospital,
  school: createSchool,
  industrial: createIndustrial,
};

/**
 * Get a demand profile for the given building type.
 * Each call returns a fresh object so consumers can hold independent references.
 */
export const getBuildingProfile = (type: BuildingType): BuildingProfile =>
  profileFactories[type]();

// ─── BuildingSimulator aggregate class ──────────────────────────────────────

export class BuildingSimulator {
  private profiles: BuildingProfile[];

  constructor(types?: BuildingType[]) {
    const defaultTypes: BuildingType[] = [
      'residential',
      'commercial',
      'hospital',
      'school',
      'industrial',
    ];
    this.profiles = (types ?? defaultTypes).map(getBuildingProfile);
  }

  /** Get demand for a specific building type. */
  getDemandByType(type: BuildingType, hour: number, isWeekend: boolean): number {
    const profile = this.profiles.find((p) => p.type === type);
    return profile ? profile.getDemand(hour, isWeekend) : 0;
  }

  /** Get total demand across all tracked buildings. */
  getTotalDemand(hour: number, isWeekend: boolean): number {
    return this.profiles.reduce(
      (sum, p) => sum + p.getDemand(hour, isWeekend),
      0,
    );
  }

  /** Get a breakdown of demand by building type. */
  getDemandBreakdown(
    hour: number,
    isWeekend: boolean,
  ): Record<BuildingType, number> {
    const breakdown = {} as Record<BuildingType, number>;
    for (const p of this.profiles) {
      breakdown[p.type] = p.getDemand(hour, isWeekend);
    }
    return breakdown;
  }
}

/** Singleton instance for app-wide use. */
const buildingSimulator = new BuildingSimulator();
export default buildingSimulator;
