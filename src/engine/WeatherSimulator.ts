// ─── Weather Simulator ──────────────────────────────────────────────────────
// Generates slowly-evolving, realistic weather data modeled on Chennai's
// tropical climate.  Uses layered sine waves at different frequencies to
// approximate smooth Perlin-like noise without a noise library.
// ─────────────────────────────────────────────────────────────────────────────

export type WeatherCondition = 'sunny' | 'cloudy' | 'rainy' | 'stormy';

export interface WeatherData {
  /** Ambient temperature in °C */
  temperature: number;
  /** Cloud cover percentage 0-100 */
  cloudCover: number;
  /** Wind speed in m/s */
  windSpeed: number;
  /** Rain probability 0-100 */
  rainProbability: number;
  /** Relative humidity 0-100 */
  humidity: number;
  /** Human-readable condition label */
  condition: WeatherCondition;
}

// ─── Internal helpers ───────────────────────────────────────────────────────

/** Clamp a value between min and max. */
const clamp = (v: number, min: number, max: number): number =>
  Math.max(min, Math.min(max, v));

/**
 * Multi-octave sine noise.
 * Combines several sine waves at different frequencies and phases to produce
 * a smooth, slowly-varying signal that loosely resembles Perlin noise output.
 */
const fractalSine = (t: number, seed: number): number => {
  const s = seed * 1000;
  return (
    0.5 * Math.sin(t * 0.017 + s) +
    0.25 * Math.sin(t * 0.031 + s * 1.3) +
    0.125 * Math.sin(t * 0.059 + s * 0.7) +
    0.0625 * Math.sin(t * 0.113 + s * 1.9)
  );
};

/** Normalise fractalSine output to [0, 1]. */
const normalisedNoise = (t: number, seed: number): number => {
  const maxAmplitude = 0.5 + 0.25 + 0.125 + 0.0625; // 0.9375
  return (fractalSine(t, seed) / maxAmplitude + 1) / 2;
};

// ─── Season helpers ─────────────────────────────────────────────────────────

/**
 * Returns a seasonal multiplier for Chennai's climate.
 * - Summer (Apr-Jun):  hottest, moderate cloud
 * - Monsoon (Jul-Sep): warm, heavy cloud/rain
 * - NE Monsoon (Oct-Dec): warm, heaviest rain
 * - Winter (Jan-Mar):  mildest, clearest
 */
const getSeasonFactors = (
  month: number,
): { tempOffset: number; cloudBias: number; rainBias: number } => {
  if (month >= 3 && month <= 5) {
    // April-June (summer)
    return { tempOffset: 4, cloudBias: 15, rainBias: 10 };
  }
  if (month >= 6 && month <= 8) {
    // July-September (SW monsoon)
    return { tempOffset: 1, cloudBias: 40, rainBias: 50 };
  }
  if (month >= 9 && month <= 11) {
    // October-December (NE monsoon)
    return { tempOffset: -1, cloudBias: 50, rainBias: 65 };
  }
  // January-March (winter)
  return { tempOffset: -3, cloudBias: 10, rainBias: 5 };
};

// ─── WeatherSimulator class ────────────────────────────────────────────────

export class WeatherSimulator {
  /** Monotonically increasing tick counter – drives noise functions. */
  private tick = 0;

  /** Seeds for each weather dimension so they evolve independently. */
  private readonly seeds = {
    temp: Math.random(),
    cloud: Math.random(),
    wind: Math.random(),
    rain: Math.random(),
    humidity: Math.random(),
  };

  /**
   * Advance the simulation by one step and return current weather.
   * @param now  Optional Date; defaults to real clock.
   */
  update(now: Date = new Date()): WeatherData {
    this.tick += 1;
    const t = this.tick;
    const month = now.getMonth(); // 0-11
    const hour = now.getHours() + now.getMinutes() / 60;
    const season = getSeasonFactors(month);

    // ── Temperature ────────────────────────────────────────────────────
    // Base 30 °C ± seasonal offset, diurnal swing, plus noise.
    const diurnal = -3 * Math.cos(((hour - 14) / 24) * 2 * Math.PI); // peaks ~2 PM
    const tempNoise = (normalisedNoise(t, this.seeds.temp) - 0.5) * 4; // ±2 °C
    const temperature = clamp(
      30 + season.tempOffset + diurnal + tempNoise,
      22,
      38,
    );

    // ── Cloud cover ────────────────────────────────────────────────────
    const cloudNoise = normalisedNoise(t, this.seeds.cloud) * 60; // 0-60
    const cloudCover = clamp(
      Math.round(season.cloudBias + cloudNoise),
      0,
      100,
    );

    // ── Wind speed ─────────────────────────────────────────────────────
    // Higher at night, calmer in the afternoon.
    const nightBoost = 1.5 + Math.cos(((hour - 3) / 24) * 2 * Math.PI); // peaks ~3 AM
    const windNoise = normalisedNoise(t, this.seeds.wind) * 6;
    const windSpeed = clamp(
      parseFloat((2 + nightBoost + windNoise).toFixed(1)),
      0.5,
      18,
    );

    // ── Rain probability ───────────────────────────────────────────────
    const rainNoise = normalisedNoise(t, this.seeds.rain) * 40;
    const rainProbability = clamp(
      Math.round(season.rainBias + rainNoise - (100 - cloudCover) * 0.3),
      0,
      100,
    );

    // ── Humidity ────────────────────────────────────────────────────────
    const humidityBase = 55 + season.cloudBias * 0.3;
    const humidityNoise = (normalisedNoise(t, this.seeds.humidity) - 0.5) * 20;
    const humidity = clamp(
      Math.round(humidityBase + humidityNoise + rainProbability * 0.15),
      30,
      100,
    );

    // ── Condition ──────────────────────────────────────────────────────
    let condition: WeatherCondition = 'sunny';
    if (rainProbability > 70 && windSpeed > 10) {
      condition = 'stormy';
    } else if (rainProbability > 45) {
      condition = 'rainy';
    } else if (cloudCover > 55) {
      condition = 'cloudy';
    }

    return {
      temperature: parseFloat(temperature.toFixed(1)),
      cloudCover,
      windSpeed,
      rainProbability,
      humidity,
      condition,
    };
  }

  /** Reset internal state (useful for tests). */
  reset(): void {
    this.tick = 0;
  }
}

/** Singleton instance for app-wide use. */
const weatherSimulator = new WeatherSimulator();
export default weatherSimulator;
