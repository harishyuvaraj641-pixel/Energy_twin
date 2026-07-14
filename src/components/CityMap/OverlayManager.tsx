// ─── Overlay Manager Panel ──────────────────────────────────────────────────
// Slide-out panel for placing, configuring, and monitoring overlay assets
// on the CityMap. Supports Quick Setup (random scatter), Manual Place
// (click-on-map), satellite configuration, and live analytics.
// ─────────────────────────────────────────────────────────────────────────────

import React, { useState, useMemo } from 'react';
import {
  Zap,
  Rocket,
  MousePointerClick,
  Trash2,
  Navigation,
  ChevronDown,
  ChevronUp,
  Layers,
  BarChart3,
  Satellite,
  X,
} from 'lucide-react';
import {
  ASSET_TEMPLATES,
  type OverlayAssetType,
  type PlacedAsset,
  type PlacedBy,
} from '../../engine/OverlayAssetTypes';

interface OverlayManagerProps {
  placedAssets: PlacedAsset[];
  onQuickSetup: (type: OverlayAssetType, count: number, placedBy: PlacedBy, satelliteConfig?: { orbitType: 'LEO' | 'MEO' | 'GEO' }) => void;
  onManualPlaceToggle: (type: OverlayAssetType | null) => void;
  manualPlaceType: OverlayAssetType | null;
  onRemoveAsset: (id: string) => void;
  onFlyToAsset: (lon: number, lat: number) => void;
  onClearAll: () => void;
}

const OverlayManager: React.FC<OverlayManagerProps> = ({
  placedAssets,
  onQuickSetup,
  onManualPlaceToggle,
  manualPlaceType,
  onRemoveAsset,
  onFlyToAsset,
  onClearAll,
}) => {
  const [isOpen, setIsOpen] = useState(true);
  const [selectedType, setSelectedType] = useState<OverlayAssetType>('solar');
  const [count, setCount] = useState(5);
  const [placedBy, setPlacedBy] = useState<PlacedBy>('citizen');
  const [orbitType, setOrbitType] = useState<'LEO' | 'MEO' | 'GEO'>('LEO');
  const [showAssetList, setShowAssetList] = useState(false);
  const [mode, setMode] = useState<'quick' | 'manual'>('quick');

  // ─── Analytics ────────────────────────────────────────────────────────
  const analytics = useMemo(() => {
    let totalProduction = 0;
    let totalConsumption = 0;
    let onlineCount = 0;

    placedAssets.forEach((a) => {
      totalProduction += a.liveData.production;
      totalConsumption += a.liveData.consumption;
      if (a.liveData.status === 'online') onlineCount++;
    });

    const netBalance = totalProduction - totalConsumption;
    // ~0.82 kg CO2 per kWh avoided from fossil
    const co2Saved = (totalProduction * 0.82) / 1000; // tons/h

    return {
      total: placedAssets.length,
      online: onlineCount,
      totalProduction: Math.round(totalProduction * 10) / 10,
      totalConsumption: Math.round(totalConsumption * 10) / 10,
      netBalance: Math.round(netBalance * 10) / 10,
      co2Saved: Math.round(co2Saved * 100) / 100,
    };
  }, [placedAssets]);

  const handleDeploy = () => {
    onQuickSetup(
      selectedType,
      count,
      placedBy,
      selectedType === 'satellite' ? { orbitType } : undefined
    );
  };

  const statusColor = (status: string) => {
    switch (status) {
      case 'online': return 'text-neon-green';
      case 'warning': return 'text-yellow-400';
      case 'maintenance': return 'text-orange-400';
      case 'offline': return 'text-red-500';
      default: return 'text-text-secondary';
    }
  };

  if (!isOpen) {
    return (
      <button
        onClick={() => setIsOpen(true)}
        className="absolute bottom-4 left-4 z-20 floating-panel p-2 cursor-pointer hover:border-neon-cyan/30 transition-all"
        title="Open Overlay Manager"
      >
        <Layers className="w-5 h-5 text-neon-cyan" />
      </button>
    );
  }

  return (
    <div className="absolute bottom-4 left-4 z-20 floating-panel p-0 w-80 max-h-[calc(100%-100px)] flex flex-col overflow-hidden">
      {/* Header */}
      <div className="flex items-center justify-between p-3 border-b border-white/10">
        <div className="flex items-center gap-2">
          <Layers className="w-4 h-4 text-neon-cyan" />
          <h3 className="text-xs font-semibold text-neon-cyan uppercase tracking-wider">Overlay Manager</h3>
        </div>
        <div className="flex items-center gap-1">
          {placedAssets.length > 0 && (
            <button
              onClick={onClearAll}
              className="text-red-400/60 hover:text-red-400 p-1 rounded transition-all cursor-pointer"
              title="Clear All"
            >
              <Trash2 className="w-3.5 h-3.5" />
            </button>
          )}
          <button
            onClick={() => setIsOpen(false)}
            className="text-text-secondary hover:text-white p-1 rounded transition-all cursor-pointer"
          >
            <X className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>

      <div className="overflow-y-auto flex-1 p-3 space-y-3">
        {/* Asset Palette */}
        <div>
          <div className="text-[10px] font-medium text-text-secondary uppercase tracking-wider mb-2">Select Asset Type</div>
          <div className="grid grid-cols-6 gap-1">
            {ASSET_TEMPLATES.map((t) => (
              <button
                key={t.type}
                onClick={() => setSelectedType(t.type)}
                className={`flex flex-col items-center p-1.5 rounded-lg text-[10px] transition-all cursor-pointer ${
                  selectedType === t.type
                    ? 'bg-neon-cyan/15 border border-neon-cyan/30 text-white shadow-[0_0_8px_rgba(0,245,255,0.15)]'
                    : 'hover:bg-white/5 text-text-secondary border border-transparent'
                }`}
                title={t.label}
              >
                <span className="text-sm">{t.emoji}</span>
                <span className="truncate w-full text-center mt-0.5 leading-tight">{t.label.split(' ')[0]}</span>
              </button>
            ))}
          </div>
        </div>

        {/* Mode Toggle */}
        <div className="flex gap-1">
          <button
            onClick={() => { setMode('quick'); onManualPlaceToggle(null); }}
            className={`flex-1 flex items-center justify-center gap-1.5 py-1.5 rounded-lg text-xs transition-all cursor-pointer ${
              mode === 'quick'
                ? 'bg-neon-cyan/10 text-neon-cyan border border-neon-cyan/20'
                : 'text-text-secondary hover:bg-white/5 border border-transparent'
            }`}
          >
            <Rocket className="w-3 h-3" />
            Quick Setup
          </button>
          <button
            onClick={() => setMode('manual')}
            className={`flex-1 flex items-center justify-center gap-1.5 py-1.5 rounded-lg text-xs transition-all cursor-pointer ${
              mode === 'manual'
                ? 'bg-neon-green/10 text-neon-green border border-neon-green/20'
                : 'text-text-secondary hover:bg-white/5 border border-transparent'
            }`}
          >
            <MousePointerClick className="w-3 h-3" />
            Manual Place
          </button>
        </div>

        {/* Quick Setup Mode */}
        {mode === 'quick' && (
          <div className="space-y-2 bg-white/[0.02] rounded-xl p-2.5 border border-white/5">
            {/* Count slider */}
            <div>
              <div className="flex justify-between text-[10px] text-text-secondary mb-1">
                <span>Count</span>
                <span className="text-neon-cyan font-semibold">{count}</span>
              </div>
              <input
                type="range"
                min={1}
                max={50}
                value={count}
                onChange={(e) => setCount(Number(e.target.value))}
                className="w-full h-1 appearance-none bg-white/10 rounded-full outline-none accent-neon-cyan"
              />
            </div>

            {/* Placed By */}
            <div className="flex gap-1">
              <button
                onClick={() => setPlacedBy('citizen')}
                className={`flex-1 text-[10px] py-1 rounded-md transition-all cursor-pointer ${
                  placedBy === 'citizen'
                    ? 'bg-blue-500/15 text-blue-400 border border-blue-400/20'
                    : 'text-text-secondary border border-transparent hover:bg-white/5'
                }`}
              >
                👤 Citizen
              </button>
              <button
                onClick={() => setPlacedBy('government')}
                className={`flex-1 text-[10px] py-1 rounded-md transition-all cursor-pointer ${
                  placedBy === 'government'
                    ? 'bg-amber-500/15 text-amber-400 border border-amber-400/20'
                    : 'text-text-secondary border border-transparent hover:bg-white/5'
                }`}
              >
                🏛️ Government
              </button>
            </div>

            {/* Satellite-specific config */}
            {selectedType === 'satellite' && (
              <div className="space-y-1.5 pt-1 border-t border-white/5">
                <div className="flex items-center gap-1 text-[10px] text-text-secondary">
                  <Satellite className="w-3 h-3" />
                  Orbit Configuration
                </div>
                <div className="flex gap-1">
                  {(['LEO', 'MEO', 'GEO'] as const).map((ot) => (
                    <button
                      key={ot}
                      onClick={() => setOrbitType(ot)}
                      className={`flex-1 text-[10px] py-1 rounded-md transition-all cursor-pointer ${
                        orbitType === ot
                          ? 'bg-neon-cyan/15 text-neon-cyan border border-neon-cyan/20'
                          : 'text-text-secondary border border-transparent hover:bg-white/5'
                      }`}
                    >
                      {ot}
                    </button>
                  ))}
                </div>
                <div className="text-[9px] text-text-secondary">
                  {orbitType === 'LEO' && '200km — High-res imaging, fast revisit'}
                  {orbitType === 'MEO' && '2,000km — Navigation, medium coverage'}
                  {orbitType === 'GEO' && '36,000km — Wide area, persistent view'}
                </div>
              </div>
            )}

            {/* Deploy Button */}
            <button
              onClick={handleDeploy}
              className="w-full flex items-center justify-center gap-2 py-2 rounded-xl text-xs font-semibold bg-gradient-to-r from-neon-cyan/20 to-neon-green/20 text-neon-cyan border border-neon-cyan/20 hover:border-neon-cyan/40 hover:shadow-[0_0_15px_rgba(0,245,255,0.15)] transition-all cursor-pointer"
            >
              <Zap className="w-3.5 h-3.5" />
              Deploy {count} {ASSET_TEMPLATES.find((t) => t.type === selectedType)?.label}s
            </button>
          </div>
        )}

        {/* Manual Place Mode */}
        {mode === 'manual' && (
          <div className="space-y-2 bg-white/[0.02] rounded-xl p-2.5 border border-white/5">
            <div className="text-[10px] text-text-secondary">
              {manualPlaceType
                ? `Click anywhere on the map to place a ${ASSET_TEMPLATES.find((t) => t.type === selectedType)?.emoji} ${ASSET_TEMPLATES.find((t) => t.type === selectedType)?.label}`
                : 'Activate placement mode, then click on the map.'}
            </div>
            <div className="flex gap-1">
              <button
                onClick={() => setPlacedBy('citizen')}
                className={`flex-1 text-[10px] py-1 rounded-md transition-all cursor-pointer ${
                  placedBy === 'citizen'
                    ? 'bg-blue-500/15 text-blue-400 border border-blue-400/20'
                    : 'text-text-secondary border border-transparent hover:bg-white/5'
                }`}
              >
                👤 Citizen
              </button>
              <button
                onClick={() => setPlacedBy('government')}
                className={`flex-1 text-[10px] py-1 rounded-md transition-all cursor-pointer ${
                  placedBy === 'government'
                    ? 'bg-amber-500/15 text-amber-400 border border-amber-400/20'
                    : 'text-text-secondary border border-transparent hover:bg-white/5'
                }`}
              >
                🏛️ Government
              </button>
            </div>
            <button
              onClick={() => onManualPlaceToggle(manualPlaceType ? null : selectedType)}
              className={`w-full flex items-center justify-center gap-2 py-2 rounded-xl text-xs font-semibold transition-all cursor-pointer ${
                manualPlaceType
                  ? 'bg-red-500/10 text-red-400 border border-red-400/20 hover:bg-red-500/20'
                  : 'bg-gradient-to-r from-neon-green/20 to-neon-cyan/20 text-neon-green border border-neon-green/20 hover:border-neon-green/40 hover:shadow-[0_0_15px_rgba(57,255,20,0.15)]'
              }`}
            >
              <MousePointerClick className="w-3.5 h-3.5" />
              {manualPlaceType ? 'Cancel Placement' : 'Start Placing'}
            </button>
          </div>
        )}

        {/* Placed Assets List */}
        {placedAssets.length > 0 && (
          <div>
            <button
              onClick={() => setShowAssetList(!showAssetList)}
              className="w-full flex items-center justify-between text-[10px] font-medium text-text-secondary uppercase tracking-wider mb-1 cursor-pointer hover:text-white transition-all"
            >
              <span>Placed Assets ({placedAssets.length})</span>
              {showAssetList ? <ChevronUp className="w-3 h-3" /> : <ChevronDown className="w-3 h-3" />}
            </button>

            {showAssetList && (
              <div className="space-y-1 max-h-40 overflow-y-auto">
                {placedAssets.slice().reverse().map((asset) => (
                  <div
                    key={asset.id}
                    className="flex items-center gap-2 p-1.5 rounded-lg bg-white/[0.02] border border-white/5 hover:border-white/10 transition-all"
                  >
                    <span className="text-sm">{asset.emoji}</span>
                    <div className="flex-1 min-w-0">
                      <div className="text-[10px] text-white truncate">{asset.name}</div>
                      <div className="flex items-center gap-2 text-[9px]">
                        <span className={statusColor(asset.liveData.status)}>
                          ● {asset.liveData.status}
                        </span>
                        {asset.liveData.production > 0 && (
                          <span className="text-neon-green">{asset.liveData.production}kW</span>
                        )}
                        {asset.liveData.consumption > 0 && (
                          <span className="text-red-400">{asset.liveData.consumption}kW</span>
                        )}
                      </div>
                    </div>
                    <button
                      onClick={() => onFlyToAsset(asset.lon, asset.lat)}
                      className="p-1 text-text-secondary hover:text-neon-cyan transition-all cursor-pointer"
                      title="Fly to"
                    >
                      <Navigation className="w-3 h-3" />
                    </button>
                    <button
                      onClick={() => onRemoveAsset(asset.id)}
                      className="p-1 text-text-secondary hover:text-red-400 transition-all cursor-pointer"
                      title="Remove"
                    >
                      <Trash2 className="w-3 h-3" />
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
      </div>

      {/* Analytics Summary Bar */}
      {placedAssets.length > 0 && (
        <div className="p-2.5 border-t border-white/10 bg-white/[0.02]">
          <div className="flex items-center gap-1 mb-1.5">
            <BarChart3 className="w-3 h-3 text-neon-cyan" />
            <span className="text-[10px] font-medium text-neon-cyan uppercase tracking-wider">Live Analytics</span>
          </div>
          <div className="grid grid-cols-3 gap-1.5">
            <div className="text-center p-1 rounded-md bg-white/[0.03]">
              <div className="text-[10px] text-neon-green font-semibold">{analytics.totalProduction}</div>
              <div className="text-[8px] text-text-secondary">kW Prod</div>
            </div>
            <div className="text-center p-1 rounded-md bg-white/[0.03]">
              <div className="text-[10px] text-red-400 font-semibold">{analytics.totalConsumption}</div>
              <div className="text-[8px] text-text-secondary">kW Load</div>
            </div>
            <div className="text-center p-1 rounded-md bg-white/[0.03]">
              <div className={`text-[10px] font-semibold ${analytics.netBalance >= 0 ? 'text-neon-green' : 'text-red-400'}`}>
                {analytics.netBalance >= 0 ? '+' : ''}{analytics.netBalance}
              </div>
              <div className="text-[8px] text-text-secondary">Net kW</div>
            </div>
            <div className="text-center p-1 rounded-md bg-white/[0.03]">
              <div className="text-[10px] text-white font-semibold">{analytics.total}</div>
              <div className="text-[8px] text-text-secondary">Assets</div>
            </div>
            <div className="text-center p-1 rounded-md bg-white/[0.03]">
              <div className="text-[10px] text-neon-cyan font-semibold">{analytics.online}</div>
              <div className="text-[8px] text-text-secondary">Online</div>
            </div>
            <div className="text-center p-1 rounded-md bg-white/[0.03]">
              <div className="text-[10px] text-green-300 font-semibold">{analytics.co2Saved}t</div>
              <div className="text-[8px] text-text-secondary">CO₂/h</div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default OverlayManager;
