<p align="center">
  <img src="https://img.shields.io/badge/React-19-61DAFB?style=for-the-badge&logo=react&logoColor=white" alt="React 19" />
  <img src="https://img.shields.io/badge/TypeScript-6.0-3178C6?style=for-the-badge&logo=typescript&logoColor=white" alt="TypeScript" />
  <img src="https://img.shields.io/badge/Vite-8-646CFF?style=for-the-badge&logo=vite&logoColor=white" alt="Vite" />
  <img src="https://img.shields.io/badge/CesiumJS-1.143-6CADDF?style=for-the-badge&logo=cesium&logoColor=white" alt="CesiumJS" />
  <img src="https://img.shields.io/badge/NVIDIA%20NIM-AI-76B900?style=for-the-badge&logo=nvidia&logoColor=white" alt="NVIDIA NIM" />
  <img src="https://img.shields.io/badge/Supabase-Auth%20%26%20DB-3FCF8E?style=for-the-badge&logo=supabase&logoColor=white" alt="Supabase" />
  <img src="https://img.shields.io/badge/TailwindCSS-4-06B6D4?style=for-the-badge&logo=tailwindcss&logoColor=white" alt="TailwindCSS" />
  <img src="https://img.shields.io/badge/License-MIT-yellow?style=for-the-badge" alt="License" />
</p>

<h1 align="center">⚡ AI-Driven Energy Twin for Smart City Renewable Energy</h1>

<p align="center">
  <strong>A real-time 3D digital twin platform that fuses CesiumJS geospatial visualization, physics-based energy simulation, and NVIDIA NIM-powered AI to model, monitor, and optimize renewable energy infrastructure at city scale.</strong>
</p>

<p align="center">
  <a href="#-key-highlights">Highlights</a> •
  <a href="#%EF%B8%8F-architecture-overview">Architecture</a> •
  <a href="#-simulation-engine-deep-dive">Simulation Engine</a> •
  <a href="#-feature-breakdown">Features</a> •
  <a href="#-getting-started">Setup</a> •
  <a href="#-project-structure">Structure</a> •
  <a href="#-contributing">Contributing</a>
</p>

---

## 🎯 Key Highlights

| Metric | Value |
| :--- | :--- |
| **Simulated Solar Capacity** | 5,000 kW peak nameplate |
| **Simulated Wind Capacity** | 2,000 kW peak nameplate |
| **Battery Storage Modeled** | 10,000 kWh with 2 MW charge/discharge |
| **Building Types Simulated** | Residential · Commercial · Hospital · School · Industrial |
| **Overlay Layers** | Energy Heatmap · Grid Topology · Solar Potential · Traffic · Weather |
| **Asset Types Placeable** | Solar · Wind · Battery · EV · Hospital · School · Substation · Satellite |
| **Weather Model** | Chennai tropical climate — seasonal monsoons, diurnal temperature swings |
| **AI Backend** | NVIDIA NIM LLM proxy (meta/llama-3.1-8b-instruct) |

---

## 🏗️ Architecture Overview

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                          BROWSER CLIENT (React 19 + Vite 8)                │
│                                                                             │
│  ┌──────────────┐  ┌──────────────────┐  ┌──────────────────────────────┐  │
│  │ Landing Page  │  │  Login (Supabase) │  │  Role-Based Routing          │  │
│  │ (GSAP + Motion)│ │  Auth Context     │  │  /citizen  ↔  /operator     │  │
│  └──────┬───────┘  └────────┬─────────┘  └──────────────┬───────────────┘  │
│         │                   │                            │                  │
│  ┌──────▼───────────────────▼────────────────────────────▼───────────────┐  │
│  │                    SIMULATION CONTEXT (React Context API)             │  │
│  │  ┌────────────────┐  ┌──────────────────┐  ┌────────────────────┐    │  │
│  │  │ WeatherSimulator│  │ BuildingSimulator │  │ SimulationEngine   │    │  │
│  │  │ (fractal sine   │  │ (5 building types │  │ (solar/wind/grid   │    │  │
│  │  │  noise model)   │  │  with demand      │  │  battery dispatch  │    │  │
│  │  │                 │  │  curves)           │  │  + carbon/cost)    │    │  │
│  │  └────────┬───────┘  └─────────┬──────────┘  └─────────┬──────────┘  │  │
│  │           └────────────────────┼────────────────────────┘             │  │
│  │                                │  tick() → SimulationData snapshot    │  │
│  └────────────────────────────────┼─────────────────────────────────────┘  │
│                                   │                                        │
│  ┌────────────────────────────────▼─────────────────────────────────────┐  │
│  │                     VISUALIZATION LAYER                              │  │
│  │  CesiumJS Globe │ Resium Entities │ OverlayManager │ 3D Smart Home  │  │
│  │  Recharts Panels │ Framer Motion UI │ GSAP Animations               │  │
│  └──────────────────────────────────────────────────────────────────────┘  │
│                                                                             │
│  ┌──────────────────────────────────────────────────────────────────────┐  │
│  │                     AI CHATBOT (ChatWidget.tsx)                       │  │
│  │  Voice + Text → Express Proxy → NVIDIA NIM API → Streaming Response  │  │
│  └──────────────────────────────────────────────────────────────────────┘  │
└────────────────────────────────┬────────────────────────────────────────────┘
                                 │ HTTP
┌────────────────────────────────▼────────────────────────────────────────────┐
│                    BACKEND SERVER (Express + tsx)                           │
│  POST /api/chat   → NVIDIA NIM proxy with in-memory chat history           │
│  GET  /api/status → Service health check (Supabase / NIM / Cesium)         │
│  Production mode  → Serves Vite build from /dist                           │
└─────────────────────────────────────────────────────────────────────────────┘
```

---

## 🔬 Simulation Engine Deep Dive

The platform runs a deterministic, tick-based physics simulation that models an entire city's energy ecosystem. Every **5 simulated minutes**, the engine computes a full state snapshot:

### ☀️ Solar Generation Model
- Bell-curve irradiance peaking at **12:30 PM** (σ = 3.2 hours)
- Cloud attenuation: 0% cloud → 100% output, 100% cloud → 15% output
- Zero output before 6:00 AM and after 6:30 PM
- ±3% stochastic noise per tick for realism

### 💨 Wind Generation Model
- Power output ∝ **v³** (cubic wind speed law) capped at rated capacity
- Cut-in speed: **3 m/s** · Cut-out speed: **25 m/s**
- Diurnal bias: stronger output at night (cosine-weighted, peaks ~3 AM)
- ±5% stochastic noise per tick

### 🏢 Building Demand Profiles
Each building type has a unique **24-hour demand curve** shaped by Gaussian bumps:

| Building | Base Load | Peak Pattern | Weekend Behavior |
| :--- | :--- | :--- | :--- |
| **Residential** | 800 kW | Morning (8 AM) + Evening (8 PM) | +150 kW daytime boost |
| **Commercial** | 1,500 kW | Plateau 9 AM–5 PM | Drops to 30% skeleton |
| **Hospital** | 600 kW | Slight daytime surge (surgeries) | 24/7 critical — ±5% noise only |
| **School** | 400 kW | Bell curve 7 AM–4 PM | Near-zero (30 kW security) |
| **Industrial** | 2,000 kW | 24/7 with daytime boost | 85% of weekday load |

### 🔋 Battery Dispatch Logic
- Charges from excess renewable generation at up to **2 MW**
- Discharges to meet demand deficit before grid import
- State-of-charge bounded to **5–95%** to protect battery health
- Full SOC visibility in operator dashboard

### 🌦️ Weather Engine
- **Chennai tropical climate** modeled with seasonal monsoon patterns
- Multi-octave fractal sine noise (4 harmonics) for smooth, Perlin-like evolution
- Independent noise seeds for temperature, cloud cover, wind, rain, and humidity
- Diurnal temperature swing peaking at **2:00 PM**
- Seasonal factors: Summer (Apr–Jun) · SW Monsoon (Jul–Sep) · NE Monsoon (Oct–Dec) · Winter (Jan–Mar)

### ⚡ Grid Exchange & Metrics
- **Grid Import**: fills remaining demand after renewables + battery discharge
- **Grid Export**: surplus renewable energy sold at feed-in tariff (₹3.5/kWh)
- **Carbon Saved**: `renewable_kWh × 0.82 kg CO₂/kWh` (Indian grid average)
- **Cost Savings**: `avoided_grid_kWh × ₹8.5/kWh + export_revenue`

---

## 🧩 Feature Breakdown

### 🔭 Operator Control Room (`/operator`)

| Module | Description |
| :--- | :--- |
| **Command Center** | Real-time KPIs — solar/wind output, battery SOC, grid exchange, renewable %, carbon saved |
| **3D City Map** | CesiumJS globe with placeable assets, multi-layer overlays, and live building telemetry |
| **Forecast Panel** | 24-hour demand/generation forecast curves with weather-adjusted projections |
| **What-If Simulator** | 9-slider sandbox: solar panels, wind turbines, battery capacity, EV chargers, population, cloud, temperature, electricity price, renewable target |
| **AI Grid Optimization** | NVIDIA NIM-powered recommendations for load balancing, dynamic tariffs, and grid routing |
| **Anomaly Detection** | Real-time alert feed for substation overloads, generation drops, and grid frequency deviations |
| **Emergency Mode** | Blackout/brownout protocols, grid isolation, load shedding priority matrix, essential power redirection |
| **System Health** | Infrastructure uptime monitoring, transformer loading, line losses, equipment status |
| **Report Generator** | Export PDF/CSV reports with telemetry summaries, optimization logs, and carbon accounting |
| **Demo Controller** | Guided walkthrough mode for presentations and stakeholder demos |

### 🏠 Citizen Portal (`/citizen`)

| Module | Description |
| :--- | :--- |
| **Overview Dashboard** | Personal energy KPIs with sparkline trends and weekly consumption charts |
| **3D Smart Home** | Immersive Three.js/React Three Fiber 3D house with interactive appliance-level monitoring |
| **Energy Usage** | Detailed consumption analytics with appliance breakdown and historical trends |
| **Solar Estimator** | Rooftop solar ROI calculator — payback period, annual savings, CO₂ offset projections |
| **EV Charging** | Charging session tracker, station availability, cost optimizer, and smart scheduling |
| **Carbon Footprint** | Personal carbon accounting with category breakdowns and reduction recommendations |
| **Community** | Neighborhood energy challenges, leaderboards, green badges, and collective impact tracking |
| **AI Assistant** | Natural language chatbot for energy advice, bill explanations, and optimization tips |
| **Bill Estimator** | Predictive monthly bill calculator based on current usage patterns and tariff structure |

### 🤖 AI Chatbot (Both Portals)
- **NVIDIA NIM Integration**: Server-side proxy to `meta/llama-3.1-8b-instruct`
- Context-aware energy advice with in-memory conversation history
- Operator: grid optimization, anomaly analysis, scenario recommendations
- Citizen: bill reduction tips, solar guidance, carbon offset strategies

---

## 🛠️ Technology Stack

| Layer | Technologies |
| :--- | :--- |
| **Frontend Framework** | React 19 · TypeScript 6.0 · Vite 8 |
| **3D Visualization** | CesiumJS · Resium · React Three Fiber · Three.js · Drei |
| **Styling & Animation** | TailwindCSS v4 · Framer Motion · GSAP |
| **Data Visualization** | Recharts |
| **Authentication & DB** | Supabase (Auth + PostgreSQL) |
| **AI / LLM** | NVIDIA NIM API (server-proxied) |
| **Backend** | Express 5 · tsx (TypeScript execution) |
| **Reporting** | jsPDF · html2canvas · PapaParse (CSV) |
| **Icons** | Lucide React |

---

## 🚀 Getting Started

### Prerequisites
- **Node.js** ≥ 18.0
- **npm** ≥ 9.0 (or yarn / pnpm)
- A [CesiumJS Ion](https://ion.cesium.com/) account (free tier available)
- A [Supabase](https://supabase.com/) project
- An [NVIDIA NIM](https://build.nvidia.com/) API key

### 1 · Clone the Repository
```bash
git clone https://github.com/harishyuvaraj641-pixel/Energy_twin.git
cd Energy_twin
```

### 2 · Install Dependencies
```bash
npm install
```

### 3 · Configure Environment Variables
Create a `.env` file in the project root:
```env
# ─── CesiumJS ────────────────────────────────
VITE_CESIUM_ION_TOKEN=your_cesium_ion_access_token

# ─── Supabase ─────────────────────────────────
VITE_SUPABASE_URL=https://your-project.supabase.co
VITE_SUPABASE_ANON_KEY=your_supabase_anon_key

# ─── NVIDIA NIM (server-side proxy) ──────────
VITE_NVIDIA_NIM_API_KEY=nvapi-your_nvidia_nim_key

# ─── Backend API ──────────────────────────────
VITE_API_URL=http://localhost:3001

# ─── Google Maps (optional) ───────────────────
VITE_GOOGLE_MAPS_API_KEY=your_google_maps_key
```

### 4 · Start the Servers

**Terminal 1 — Backend (Express proxy):**
```bash
npm run server
# → 🚀 Smart City Backend Server running on http://localhost:3001
```

**Terminal 2 — Frontend (Vite dev server):**
```bash
npm run dev
# → http://localhost:5173/
```

### 5 · Production Build
```bash
npm run build    # TypeScript check + Vite production bundle → /dist
npm run preview  # Preview the production build locally
```

---

## 📁 Project Structure

```
Energy_twin/
├── server/
│   └── index.ts                    # Express backend — NVIDIA NIM proxy + health API
├── src/
│   ├── engine/                     # ⚙️ Core simulation models
│   │   ├── SimulationEngine.ts     #    Main tick loop — solar, wind, battery, grid
│   │   ├── WeatherSimulator.ts     #    Chennai climate model (fractal sine noise)
│   │   ├── BuildingSimulator.ts    #    5 building demand profiles with curves
│   │   └── OverlayAssetTypes.ts    #    Asset catalog + live telemetry generators
│   ├── contexts/                   # 🔄 React Context providers
│   │   ├── AuthContext.tsx          #    Supabase auth + role-based access
│   │   ├── SimulationContext.tsx    #    Engine state broadcast to all components
│   │   └── CitizenContext.tsx       #    Citizen-specific state management
│   ├── components/
│   │   ├── CityMap/                # 🗺️ CesiumJS 3D globe + overlay manager
│   │   ├── Operator/               # 🛠️ 8 operator dashboard panels
│   │   ├── Citizen/                # 🏠 8 citizen portal modules (incl. 3D house)
│   │   ├── AIChatbot/              # 🤖 NVIDIA NIM chat widget
│   │   ├── DemoMode/               # 🎬 Guided demo controller
│   │   ├── ParticleBackground.tsx  #    Canvas-based particle animation
│   │   └── AnimatedCounter.tsx     #    Number count-up animation
│   ├── lib/
│   │   └── supabase.ts             #    Supabase client initialization
│   ├── pages/
│   │   ├── LandingPage.tsx          #    Marketing landing with animated stats
│   │   ├── LoginPage.tsx            #    Role-based auth (Citizen / Operator)
│   │   ├── CitizenDashboard.tsx     #    Citizen portal shell + navigation
│   │   └── OperatorDashboard.tsx    #    Operator control room shell + navigation
│   ├── App.tsx                      #    React Router + protected routes
│   ├── main.tsx                     #    Application entry point
│   └── index.css                    #    Global design tokens + TailwindCSS imports
├── .env                             #    Environment variables (git-ignored)
├── .gitignore
├── index.html                       #    HTML shell
├── package.json
├── tsconfig.json
├── vite.config.ts                   #    Vite + React + TailwindCSS + Cesium plugins
└── vercel.json                      #    Vercel deployment configuration
```

---

## 🤝 Contributing

Contributions are welcome! Please follow these steps:

1. **Fork** the repository
2. **Create** a feature branch (`git checkout -b feature/amazing-feature`)
3. **Commit** your changes (`git commit -m 'feat: add amazing feature'`)
4. **Push** to the branch (`git push origin feature/amazing-feature`)
5. **Open** a Pull Request

---

## 📄 License

This project is licensed under the **MIT License** — see the [LICENSE](LICENSE) file for details.

---

<p align="center">
  <sub>Built with ⚡ for a sustainable, AI-powered energy future</sub>
</p>
