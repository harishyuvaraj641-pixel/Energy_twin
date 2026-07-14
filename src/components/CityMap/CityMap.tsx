import React, { useRef, useEffect, useState, useCallback } from 'react';
import { Viewer, Entity, CameraFlyTo, Cesium3DTileset } from 'resium';
import {
  Cartesian3,
  Ion,
  Color,
  IonResource,
  Math as CesiumMath,
  Viewer as CesiumViewer,
  NearFarScalar,
  VerticalOrigin,
  HorizontalOrigin,
  HeightReference,
  PolylineDashMaterialProperty,
  PolylineGlowMaterialProperty,
  createGooglePhotorealistic3DTileset,
  ScreenSpaceEventType,
  ScreenSpaceEventHandler,
  Cartographic,
  Ellipsoid,
  Cartesian2,
  defined,
} from 'cesium';
import 'cesium/Build/Cesium/Widgets/widgets.css';
import { Search, Loader2, MapPin } from 'lucide-react';
import OverlayManager from './OverlayManager';
import { useSimulation } from '../../contexts/SimulationContext';
import {
  generateRandomPlacements,
  generateAssetData,
  getTemplate,
  ASSET_TEMPLATES,
  type PlacedAsset,
  type OverlayAssetType,
  type PlacedBy,
} from '../../engine/OverlayAssetTypes';

// Set Cesium Ion token
Ion.defaultAccessToken = import.meta.env.VITE_CESIUM_ION_TOKEN || '';

// Chennai city center coordinates
const CHENNAI_CENTER = {
  lon: 80.2707,
  lat: 13.0827,
  alt: 400,
};

// Default digital twin assets (hardcoded base layer)
const digitalTwinAssets = [
  { id: 'solar-1', type: 'solar', name: 'Solar Farm - Anna Nagar', lon: 80.2099, lat: 13.0850, emoji: '☀️', color: '#ffd700', desc: '2.5 MW Solar Array | Production: 1,850 kW' },
  { id: 'solar-2', type: 'solar', name: 'Solar Rooftop - T Nagar', lon: 80.2333, lat: 13.0400, emoji: '☀️', color: '#ffd700', desc: '800 kW Rooftop Installation' },
  { id: 'solar-3', type: 'solar', name: 'Solar Farm - OMR', lon: 80.2440, lat: 12.9600, emoji: '☀️', color: '#ffd700', desc: '5 MW Solar Park | Production: 3,200 kW' },
  { id: 'wind-1', type: 'wind', name: 'Wind Farm - Marina', lon: 80.2838, lat: 13.0500, emoji: '🌬️', color: '#00f5ff', desc: '3 MW Wind Turbine Cluster' },
  { id: 'wind-2', type: 'wind', name: 'Wind Farm - ECR', lon: 80.2550, lat: 12.9300, emoji: '🌬️', color: '#00f5ff', desc: '2 MW Coastal Wind Farm' },
  { id: 'battery-1', type: 'battery', name: 'Battery Hub - Guindy', lon: 80.2120, lat: 13.0067, emoji: '🔋', color: '#39ff14', desc: '5000 kWh Li-Ion Storage | 78% Charged' },
  { id: 'battery-2', type: 'battery', name: 'Battery Hub - Adyar', lon: 80.2575, lat: 13.0063, emoji: '🔋', color: '#39ff14', desc: '3000 kWh Storage | 92% Charged' },
  { id: 'ev-1', type: 'ev', name: 'EV Station - Phoenix Mall', lon: 80.2300, lat: 13.0113, emoji: '🚗', color: '#bf00ff', desc: '20 Charging Points | 15 Available' },
  { id: 'ev-2', type: 'ev', name: 'EV Station - Express Avenue', lon: 80.2635, lat: 13.0600, emoji: '🚗', color: '#bf00ff', desc: '12 Charging Points | 8 Available' },
  { id: 'ev-3', type: 'ev', name: 'EV Hub - OMR', lon: 80.2510, lat: 12.9500, emoji: '🚗', color: '#bf00ff', desc: '30 Fast Chargers | 22 Available' },
  { id: 'hospital-1', type: 'hospital', name: 'Apollo Hospital', lon: 80.2570, lat: 13.0120, emoji: '🏥', color: '#ff0844', desc: 'Critical Load | 600 kW Constant | Priority: Maximum' },
  { id: 'hospital-2', type: 'hospital', name: 'MIOT Hospital', lon: 80.2080, lat: 13.0220, emoji: '🏥', color: '#ff0844', desc: 'Critical Load | 450 kW Constant' },
  { id: 'school-1', type: 'school', name: 'IIT Madras', lon: 80.2340, lat: 12.9916, emoji: '🏫', color: '#4361ee', desc: '200 kW | Solar Powered Campus' },
  { id: 'school-2', type: 'school', name: 'Anna University', lon: 80.2345, lat: 13.0130, emoji: '🏫', color: '#4361ee', desc: '150 kW Peak Demand' },
  { id: 'commercial-1', type: 'commercial', name: 'Tidel Park IT', lon: 80.2335, lat: 12.9815, emoji: '🏢', color: '#ff6b35', desc: '3500 kW Peak | Smart Building' },
  { id: 'commercial-2', type: 'commercial', name: 'SIPCOT IT Park', lon: 80.2260, lat: 12.9490, emoji: '🏢', color: '#ff6b35', desc: '2800 kW Peak Demand' },
  { id: 'substation-1', type: 'substation', name: 'Substation - Tondiarpet', lon: 80.2820, lat: 13.1140, emoji: '⚡', color: '#ffd700', desc: '220kV Substation | Grid Node' },
  { id: 'substation-2', type: 'substation', name: 'Substation - Tambaram', lon: 80.1180, lat: 12.9249, emoji: '⚡', color: '#ffd700', desc: '110kV Distribution Hub' },
  { id: 'residential-1', type: 'residential', name: 'Smart Colony - Velachery', lon: 80.2210, lat: 12.9790, emoji: '🏠', color: '#8892a4', desc: '2500 Homes | Smart Meters Installed' },
  { id: 'residential-2', type: 'residential', name: 'Smart Colony - Mogappair', lon: 80.1800, lat: 13.0790, emoji: '🏠', color: '#8892a4', desc: '1800 Homes | Rooftop Solar' },
  { id: 'streetlight-1', type: 'streetlight', name: 'Smart Lights - Marina Beach Road', lon: 80.2790, lat: 13.0500, emoji: '💡', color: '#ffd700', desc: '500 Smart LED Lights | Auto-dimming' },
];

// Energy flow connections
const energyFlows = [
  { from: 'solar-1', to: 'battery-1', color: '#39ff14', label: 'Solar → Battery' },
  { from: 'solar-3', to: 'battery-2', color: '#39ff14', label: 'Solar → Battery' },
  { from: 'battery-1', to: 'commercial-1', color: '#4361ee', label: 'Battery → Building' },
  { from: 'battery-2', to: 'hospital-1', color: '#4361ee', label: 'Battery → Hospital' },
  { from: 'substation-1', to: 'residential-1', color: '#ff6b35', label: 'Grid → Residential' },
  { from: 'wind-1', to: 'substation-1', color: '#00f5ff', label: 'Wind → Grid' },
  { from: 'solar-2', to: 'ev-1', color: '#39ff14', label: 'Solar → EV' },
];

interface CityMapProps {
  showOverlay?: boolean;
  showEnergyFlows?: boolean;
  compact?: boolean;
  onAssetClick?: (asset: any) => void;
}

const CityMap: React.FC<CityMapProps> = ({
  showOverlay = true,
  showEnergyFlows = true,
  compact = false,
  onAssetClick,
}) => {
  const viewerRef = useRef<{ cesiumElement?: CesiumViewer }>(null);

  const handleViewerReady = useCallback((node: any) => {
    if (node) {
      (viewerRef as any).current = node;

      if (node.cesiumElement) {
        const viewer = node.cesiumElement;
        
        // Lock camera roll to keep the horizon level (prevent slanting/crooked views)
        viewer.camera.constrainedAxis = Cartesian3.UNIT_Z;
        viewer.camera.changed.addEventListener(() => {
          if (Math.abs(viewer.camera.roll) > 0.001) {
            viewer.camera.setView({
              orientation: {
                heading: viewer.camera.heading,
                pitch: viewer.camera.pitch,
                roll: 0,
              },
            });
          }
        });

        // Make navigation feel tighter, more responsive and less slippery
        const controller = viewer.scene.screenSpaceCameraController;
        controller.inertiaZoom = 0.05;   // Reduce zoom sliding/coasting
        controller.inertiaSpin = 0.05;   // Reduce rotation sliding/coasting
        controller.inertiaTranslate = 0.05; // Reduce pan sliding/coasting
        
        // Prevent zooming under terrain/buildings or out into space
        controller.minimumZoomDistance = 80;
        controller.maximumZoomDistance = 35000;
      }
    }
  }, []);
  const [flyComplete, setFlyComplete] = useState(false);
  const [visibleLayers, setVisibleLayers] = useState<Set<string>>(
    new Set(['solar', 'wind', 'battery', 'ev', 'hospital', 'substation', 'commercial', 'residential', 'school', 'streetlight'])
  );
  const [buildingsResource, setBuildingsResource] = useState<any>(null);

  // ─── User-Placed Overlay Assets from Simulation Context ───────────────
  const { placedAssets, setPlacedAssets } = useSimulation();
  const [manualPlaceType, setManualPlaceType] = useState<OverlayAssetType | null>(null);
  const [manualPlacedBy, setManualPlacedBy] = useState<PlacedBy>('citizen');

  // ─── Google 3D Tiles ──────────────────────────────────────────────────
  const [useGoogle3D, setUseGoogle3D] = useState(false);
  const googleTilesetRef = useRef<any>(null);

  // ─── Location Search ──────────────────────────────────────────────────
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<any[]>([]);
  const [isSearching, setIsSearching] = useState(false);

  // ─── Track camera center for Quick Setup placement ────────────────────
  const getCameraCenter = useCallback((): { lon: number; lat: number } => {
    const viewer = viewerRef.current?.cesiumElement;
    if (viewer) {
      const cameraPos = viewer.camera.positionCartographic;
      return {
        lon: CesiumMath.toDegrees(cameraPos.longitude),
        lat: CesiumMath.toDegrees(cameraPos.latitude),
      };
    }
    return { lon: CHENNAI_CENTER.lon, lat: CHENNAI_CENTER.lat };
  }, []);

  // ─── Load Cesium OSM Buildings ────────────────────────────────────────
  useEffect(() => {
    Promise.resolve(IonResource.fromAssetId(96188))
      .then((resource) => {
        setBuildingsResource(resource);
      })
      .catch((err) => {
        console.error('Failed to load Cesium OSM Buildings resource:', err);
      });
  }, []);

  // ─── Google 3D Tiles Toggle ───────────────────────────────────────────
  useEffect(() => {
    const viewer = viewerRef.current?.cesiumElement;
    if (!viewer) return;

    if (useGoogle3D) {
      createGooglePhotorealistic3DTileset()
        .then((tileset: any) => {
          googleTilesetRef.current = tileset;
          viewer.scene.primitives.add(tileset);
          viewer.scene.globe.show = false;
        })
        .catch((err: any) => {
          console.error('Failed to load Google Photorealistic 3D Tiles:', err);
        });
    } else {
      if (googleTilesetRef.current) {
        try {
          viewer.scene.primitives.remove(googleTilesetRef.current);
        } catch (e) { /* ignore */ }
        googleTilesetRef.current = null;
      }
      if (viewer.scene && viewer.scene.globe) {
        viewer.scene.globe.show = true;
      }
    }

    return () => {
      if (googleTilesetRef.current && viewer && !viewer.isDestroyed()) {
        try {
          viewer.scene.primitives.remove(googleTilesetRef.current);
        } catch (e) { /* ignore */ }
      }
    };
  }, [useGoogle3D]);

  // ─── Click-to-Place Handler ───────────────────────────────────────────
  useEffect(() => {
    const viewer = viewerRef.current?.cesiumElement;
    if (!viewer || !manualPlaceType) return;

    const handler = new ScreenSpaceEventHandler(viewer.scene.canvas);

    handler.setInputAction((click: { position: { x: number; y: number } }) => {
      const cartesian = viewer.camera.pickEllipsoid(
        new Cartesian2(click.position.x, click.position.y),
        viewer.scene.globe.ellipsoid
      );

      if (cartesian) {
        const cartographic = Cartographic.fromCartesian(cartesian);
        const lon = CesiumMath.toDegrees(cartographic.longitude);
        const lat = CesiumMath.toDegrees(cartographic.latitude);
        const template = getTemplate(manualPlaceType);

        const newAsset: PlacedAsset = {
          id: `${manualPlaceType}-manual-${Date.now()}`,
          type: manualPlaceType,
          name: `${template.label} (Manual)`,
          lon,
          lat,
          emoji: template.emoji,
          color: template.color,
          hologramColor: template.hologramColor,
          placedBy: manualPlacedBy,
          liveData: generateAssetData(manualPlaceType),
          timestamp: Date.now(),
          ...(manualPlaceType === 'satellite'
            ? { altitude: 200, orbitType: 'LEO' as const }
            : {}),
        };

        setPlacedAssets((prev) => [...prev, newAsset]);

        // Trigger scene update
        viewer.scene.requestRender();
      }
    }, ScreenSpaceEventType.LEFT_CLICK);

    return () => {
      handler.destroy();
    };
  }, [manualPlaceType, manualPlacedBy]);



  // ─── Handlers ─────────────────────────────────────────────────────────
  const toggleLayer = useCallback((layer: string) => {
    setVisibleLayers((prev) => {
      const next = new Set(prev);
      if (next.has(layer)) next.delete(layer);
      else next.add(layer);
      return next;
    });
  }, []);

  const flyToLocation = useCallback((lon: number, lat: number, alt: number = 500, pitchDeg: number = -45) => {
    const viewer = viewerRef.current?.cesiumElement;
    if (viewer) {
      viewer.camera.flyTo({
        destination: Cartesian3.fromDegrees(lon, lat, alt),
        orientation: {
          heading: CesiumMath.toRadians(0),
          pitch: CesiumMath.toRadians(pitchDeg),
          roll: 0,
        },
        duration: 2,
      });
    }
  }, []);

  useEffect(() => {
    const handleFlyTo = (e: Event) => {
      const detail = (e as CustomEvent).detail;
      if (detail && detail.lon !== undefined && detail.lat !== undefined) {
        flyToLocation(detail.lon, detail.lat, detail.zoom ?? 1500, detail.pitch ?? -35);
      }
    };
    window.addEventListener('fly-to-coordinates', handleFlyTo);
    return () => window.removeEventListener('fly-to-coordinates', handleFlyTo);
  }, [flyToLocation]);

  const handleSearch = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!searchQuery.trim()) return;

    setIsSearching(true);
    try {
      const response = await fetch(
        `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(
          searchQuery
        )}&limit=5`
      );
      if (response.ok) {
        const data = await response.json();
        setSearchResults(data);
      }
    } catch (err) {
      console.error('Geocoding search failed:', err);
    } finally {
      setIsSearching(false);
    }
  };

  const selectResult = (result: any) => {
    const lon = parseFloat(result.lon);
    const lat = parseFloat(result.lat);
    flyToLocation(lon, lat, 600, -30);
    setSearchQuery(result.display_name.split(',')[0]);
    setSearchResults([]);
  };

  // ─── Overlay Manager Callbacks ────────────────────────────────────────
  const handleQuickSetup = useCallback(
    (type: OverlayAssetType, count: number, placedBy: PlacedBy, satelliteConfig?: { orbitType: 'LEO' | 'MEO' | 'GEO' }) => {
      const center = getCameraCenter();
      const newAssets = generateRandomPlacements(type, count, center.lon, center.lat, 3, placedBy);

      // Apply satellite config if provided
      if (satelliteConfig && type === 'satellite') {
        const altMap = { LEO: 200, MEO: 2000, GEO: 36000 };
        newAssets.forEach((a) => {
          a.orbitType = satelliteConfig.orbitType;
          a.altitude = altMap[satelliteConfig.orbitType];
        });
      }

      setPlacedAssets((prev) => [...prev, ...newAssets]);
    },
    [getCameraCenter]
  );

  const handleManualPlaceToggle = useCallback((type: OverlayAssetType | null) => {
    setManualPlaceType(type);
  }, []);

  const handleRemoveAsset = useCallback((id: string) => {
    setPlacedAssets((prev) => prev.filter((a) => a.id !== id));
  }, []);

  const handleFlyToAsset = useCallback(
    (lon: number, lat: number) => {
      flyToLocation(lon, lat, 300, -30);
    },
    [flyToLocation]
  );

  const handleClearAll = useCallback(() => {
    setPlacedAssets([]);
  }, []);

  // ─── Helpers ──────────────────────────────────────────────────────────
  const getFlowPositions = (fromId: string, toId: string) => {
    const from = digitalTwinAssets.find((a) => a.id === fromId);
    const to = digitalTwinAssets.find((a) => a.id === toId);
    if (!from || !to) return undefined;
    return Cartesian3.fromDegreesArrayHeights([
      from.lon, from.lat, 80,
      (from.lon + to.lon) / 2, (from.lat + to.lat) / 2, 150,
      to.lon, to.lat, 80,
    ]);
  };

  const layerTypes = [
    { key: 'solar', label: 'Solar', emoji: '☀️' },
    { key: 'wind', label: 'Wind', emoji: '🌬️' },
    { key: 'battery', label: 'Battery', emoji: '🔋' },
    { key: 'ev', label: 'EV', emoji: '🚗' },
    { key: 'hospital', label: 'Hospital', emoji: '🏥' },
    { key: 'school', label: 'School', emoji: '🏫' },
    { key: 'commercial', label: 'Commercial', emoji: '🏢' },
    { key: 'residential', label: 'Residential', emoji: '🏠' },
    { key: 'substation', label: 'Substation', emoji: '⚡' },
    { key: 'streetlight', label: 'Lights', emoji: '💡' },
  ];

  // ─── Hologram beam height per type ────────────────────────────────────
  const getHologramHeight = (type: OverlayAssetType): number => {
    switch (type) {
      case 'solar': return 60;
      case 'wind': return 100;
      case 'battery': return 50;
      case 'ev': return 40;
      case 'hospital': return 90;
      case 'school': return 70;
      case 'commercial': return 110;
      case 'residential': return 55;
      case 'substation': return 80;
      case 'streetlight': return 30;
      case 'satellite': return 150;
      default: return 60;
    }
  };

  // ─── Format live data for billboard label ─────────────────────────────
  const formatLiveLabel = (asset: PlacedAsset): string => {
    const { liveData, emoji, type } = asset;
    if (type === 'satellite') {
      return `${emoji} SAT | ${liveData.signalStrength ?? 0}% Signal`;
    }
    if (liveData.production > 0) {
      return `${emoji} ${liveData.production >= 1000 ? (liveData.production / 1000).toFixed(1) + 'MW' : liveData.production + 'kW'}`;
    }
    if (liveData.consumption > 0) {
      return `${emoji} ${liveData.consumption >= 1000 ? (liveData.consumption / 1000).toFixed(1) + 'MW' : liveData.consumption + 'kW'}`;
    }
    return `${emoji} Online`;
  };

  return (
    <div className={`relative ${compact ? 'h-full' : 'w-full h-[600px]'} rounded-2xl overflow-hidden`}>
      {/* Location Search Bar */}
      <div className="absolute top-4 left-4 z-20 w-80">
        <form onSubmit={handleSearch} className="relative flex items-center">
          <input
            type="text"
            placeholder="Search city, address or landmark..."
            value={searchQuery}
            onChange={(e) => {
              setSearchQuery(e.target.value);
              if (!e.target.value.trim()) setSearchResults([]);
            }}
            className="w-full bg-bg-primary/80 backdrop-blur-md border border-white/10 text-white rounded-xl py-2 pl-10 pr-10 text-xs focus:outline-none focus:border-neon-cyan transition-all placeholder:text-text-secondary"
          />
          <div className="absolute left-3 pointer-events-none">
            {isSearching ? (
              <Loader2 className="w-4 h-4 text-neon-cyan animate-spin" />
            ) : (
              <Search className="w-4 h-4 text-text-secondary" />
            )}
          </div>
          {searchQuery && (
            <button
              type="button"
              onClick={() => {
                setSearchQuery('');
                setSearchResults([]);
              }}
              className="absolute right-3 text-text-secondary hover:text-white text-xs cursor-pointer"
            >
              ✕
            </button>
          )}
        </form>

        {/* Search Results Dropdown */}
        {searchResults.length > 0 && (
          <div className="absolute left-0 right-0 mt-2 bg-bg-primary/95 backdrop-blur-md border border-white/10 rounded-xl overflow-hidden shadow-2xl z-30 divide-y divide-white/5">
            {searchResults.map((result: any) => (
              <button
                key={result.place_id}
                onClick={() => selectResult(result)}
                className="w-full text-left px-4 py-2.5 hover:bg-white/5 transition-all text-xs flex items-start gap-2 cursor-pointer"
              >
                <MapPin className="w-4 h-4 text-neon-cyan mt-0.5 flex-shrink-0" />
                <div className="min-w-0 flex-1">
                  <div className="font-semibold text-white truncate">
                    {result.display_name.split(',')[0]}
                  </div>
                  <div className="text-[10px] text-text-secondary truncate">
                    {result.display_name.split(',').slice(1).join(',').trim()}
                  </div>
                </div>
              </button>
            ))}
          </div>
        )}
      </div>

      {/* Manual Place Indicator */}
      {manualPlaceType && (
        <div className="absolute top-4 left-1/2 -translate-x-1/2 z-20 floating-panel px-4 py-2 flex items-center gap-2 animate-pulse">
          <span className="text-sm">{getTemplate(manualPlaceType).emoji}</span>
          <span className="text-xs text-neon-green font-semibold">Click on the map to place</span>
        </div>
      )}

      <Viewer
        ref={handleViewerReady}
        full={compact}
        style={compact ? undefined : { width: '100%', height: '600px' }}
        timeline={false}
        animation={false}
        baseLayerPicker={false}
        geocoder={false}
        homeButton={false}
        sceneModePicker={false}
        navigationHelpButton={false}
        fullscreenButton={false}
        selectionIndicator={false}
        infoBox={false}
        requestRenderMode={true}
        maximumRenderTimeChange={Infinity}
      >
        {/* Cinematic fly-in */}
        {!flyComplete && (
          <CameraFlyTo
            destination={Cartesian3.fromDegrees(
              CHENNAI_CENTER.lon,
              CHENNAI_CENTER.lat,
              compact ? 1200 : 2200
            )}
            orientation={{
              heading: CesiumMath.toRadians(15),
              pitch: CesiumMath.toRadians(-25),
              roll: 0,
            }}
            duration={4}
            once
            onComplete={() => setFlyComplete(true)}
          />
        )}

        {/* 3D Buildings */}
        {buildingsResource && !useGoogle3D && (
          <Cesium3DTileset
            url={buildingsResource}
            maximumScreenSpaceError={16}
          />
        )}

        {/* ═══ 3D Floating Object Overlays (Default + User-Placed) ═══ */}
        {placedAssets
          .filter((asset) => visibleLayers.has(asset.type))
          .map((asset) => {
            const hColor = Color.fromCssColorString(asset.hologramColor);
            const baseAlt = getHologramHeight(asset.type);
          const isSatellite = asset.type === 'satellite';

          return (
            <React.Fragment key={asset.id}>
              {/* ── Hologram Beam Pillar ── */}
              <Entity
                position={Cartesian3.fromDegrees(asset.lon, asset.lat, baseAlt * 0.4)}
                onClick={() => onAssetClick?.(asset)}
                cylinder={{
                  length: baseAlt * 0.8,
                  topRadius: 2,
                  bottomRadius: 6,
                  material: hColor.withAlpha(0.07),
                  outline: true,
                  outlineColor: hColor.withAlpha(0.2),
                  numberOfVerticalLines: 0,
                  heightReference: HeightReference.RELATIVE_TO_GROUND,
                }}
              />

              {/* ── Ground Glow Ring ── */}
              <Entity
                position={Cartesian3.fromDegrees(asset.lon, asset.lat, 1)}
                ellipse={{
                  semiMajorAxis: 20,
                  semiMinorAxis: 20,
                  material: hColor.withAlpha(0.12),
                  outline: true,
                  outlineColor: hColor.withAlpha(0.4),
                  heightReference: HeightReference.RELATIVE_TO_GROUND,
                }}
              />

              {/* ═══ TYPE-SPECIFIC 3D FLOATING OBJECT ═══ */}

              {/* ☀️ Solar Panel — flat tilted golden box + glowing orb */}
              {asset.type === 'solar' && (
                <>
                  <Entity
                    position={Cartesian3.fromDegrees(asset.lon, asset.lat, baseAlt)}
                    box={{
                      dimensions: new Cartesian3(18, 12, 1.5),
                      material: Color.fromCssColorString('#ffd700').withAlpha(0.7),
                      outline: true,
                      outlineColor: Color.fromCssColorString('#ffec80').withAlpha(0.9),
                      heightReference: HeightReference.RELATIVE_TO_GROUND,
                    }}
                  />
                  <Entity
                    position={Cartesian3.fromDegrees(asset.lon, asset.lat, baseAlt + 12)}
                    ellipsoid={{
                      radii: new Cartesian3(5, 5, 5),
                      material: Color.fromCssColorString('#ffd700').withAlpha(0.35),
                      outline: true,
                      outlineColor: Color.fromCssColorString('#ffd700').withAlpha(0.7),
                      heightReference: HeightReference.RELATIVE_TO_GROUND,
                    }}
                  />
                </>
              )}

              {/* 🌬️ Wind Turbine — tall tower + spinning sphere on top */}
              {asset.type === 'wind' && (
                <>
                  <Entity
                    position={Cartesian3.fromDegrees(asset.lon, asset.lat, baseAlt * 0.5)}
                    cylinder={{
                      length: baseAlt,
                      topRadius: 1.5,
                      bottomRadius: 3,
                      material: Color.fromCssColorString('#e0e0e0').withAlpha(0.6),
                      outline: true,
                      outlineColor: Color.fromCssColorString('#00f5ff').withAlpha(0.5),
                      heightReference: HeightReference.RELATIVE_TO_GROUND,
                    }}
                  />
                  <Entity
                    position={Cartesian3.fromDegrees(asset.lon, asset.lat, baseAlt + 5)}
                    ellipsoid={{
                      radii: new Cartesian3(8, 8, 4),
                      material: Color.fromCssColorString('#00e5ff').withAlpha(0.4),
                      outline: true,
                      outlineColor: Color.fromCssColorString('#00f5ff').withAlpha(0.8),
                      heightReference: HeightReference.RELATIVE_TO_GROUND,
                    }}
                  />
                  {/* Blade arms */}
                  <Entity
                    position={Cartesian3.fromDegrees(asset.lon, asset.lat, baseAlt + 5)}
                    box={{
                      dimensions: new Cartesian3(30, 2, 1),
                      material: Color.fromCssColorString('#00f5ff').withAlpha(0.25),
                      outline: true,
                      outlineColor: Color.fromCssColorString('#00f5ff').withAlpha(0.5),
                      heightReference: HeightReference.RELATIVE_TO_GROUND,
                    }}
                  />
                </>
              )}

              {/* 🔋 Battery Storage — glowing green cube */}
              {asset.type === 'battery' && (
                <>
                  <Entity
                    position={Cartesian3.fromDegrees(asset.lon, asset.lat, baseAlt)}
                    box={{
                      dimensions: new Cartesian3(14, 10, 16),
                      material: Color.fromCssColorString('#39ff14').withAlpha(0.3),
                      outline: true,
                      outlineColor: Color.fromCssColorString('#39ff14').withAlpha(0.8),
                      heightReference: HeightReference.RELATIVE_TO_GROUND,
                    }}
                  />
                  {/* Charge level indicator (inner box) */}
                  <Entity
                    position={Cartesian3.fromDegrees(asset.lon, asset.lat, baseAlt - 3)}
                    box={{
                      dimensions: new Cartesian3(12, 8, (asset.liveData.efficiency / 100) * 14),
                      material: Color.fromCssColorString('#39ff14').withAlpha(0.6),
                      heightReference: HeightReference.RELATIVE_TO_GROUND,
                    }}
                  />
                </>
              )}

              {/* 🚗 EV Charging — purple dome + charging bolt */}
              {asset.type === 'ev' && (
                <>
                  <Entity
                    position={Cartesian3.fromDegrees(asset.lon, asset.lat, baseAlt)}
                    ellipsoid={{
                      radii: new Cartesian3(10, 10, 6),
                      material: Color.fromCssColorString('#bf00ff').withAlpha(0.35),
                      outline: true,
                      outlineColor: Color.fromCssColorString('#d050ff').withAlpha(0.7),
                      heightReference: HeightReference.RELATIVE_TO_GROUND,
                    }}
                  />
                  <Entity
                    position={Cartesian3.fromDegrees(asset.lon, asset.lat, baseAlt + 10)}
                    cylinder={{
                      length: 8,
                      topRadius: 0.5,
                      bottomRadius: 3,
                      material: Color.fromCssColorString('#d050ff').withAlpha(0.5),
                      heightReference: HeightReference.RELATIVE_TO_GROUND,
                    }}
                  />
                </>
              )}

              {/* 🏥 Hospital — red cross (two intersecting boxes) */}
              {asset.type === 'hospital' && (
                <>
                  <Entity
                    position={Cartesian3.fromDegrees(asset.lon, asset.lat, baseAlt)}
                    box={{
                      dimensions: new Cartesian3(22, 6, 6),
                      material: Color.fromCssColorString('#ff0844').withAlpha(0.5),
                      outline: true,
                      outlineColor: Color.fromCssColorString('#ff2060').withAlpha(0.8),
                      heightReference: HeightReference.RELATIVE_TO_GROUND,
                    }}
                  />
                  <Entity
                    position={Cartesian3.fromDegrees(asset.lon, asset.lat, baseAlt)}
                    box={{
                      dimensions: new Cartesian3(6, 22, 6),
                      material: Color.fromCssColorString('#ff0844').withAlpha(0.5),
                      outline: true,
                      outlineColor: Color.fromCssColorString('#ff2060').withAlpha(0.8),
                      heightReference: HeightReference.RELATIVE_TO_GROUND,
                    }}
                  />
                </>
              )}

              {/* 🏫 School — blue pyramid (cone) */}
              {asset.type === 'school' && (
                <>
                  <Entity
                    position={Cartesian3.fromDegrees(asset.lon, asset.lat, baseAlt - 5)}
                    cylinder={{
                      length: 20,
                      topRadius: 0,
                      bottomRadius: 14,
                      material: Color.fromCssColorString('#4361ee').withAlpha(0.35),
                      outline: true,
                      outlineColor: Color.fromCssColorString('#5080ff').withAlpha(0.7),
                      heightReference: HeightReference.RELATIVE_TO_GROUND,
                    }}
                  />
                  <Entity
                    position={Cartesian3.fromDegrees(asset.lon, asset.lat, baseAlt + 8)}
                    ellipsoid={{
                      radii: new Cartesian3(4, 4, 4),
                      material: Color.fromCssColorString('#5080ff').withAlpha(0.5),
                      outline: true,
                      outlineColor: Color.fromCssColorString('#5080ff').withAlpha(0.9),
                      heightReference: HeightReference.RELATIVE_TO_GROUND,
                    }}
                  />
                </>
              )}

              {/* 🏢 Commercial — tall glass tower */}
              {asset.type === 'commercial' && (
                <>
                  <Entity
                    position={Cartesian3.fromDegrees(asset.lon, asset.lat, baseAlt)}
                    box={{
                      dimensions: new Cartesian3(12, 12, 35),
                      material: Color.fromCssColorString('#ff6b35').withAlpha(0.25),
                      outline: true,
                      outlineColor: Color.fromCssColorString('#ff8050').withAlpha(0.7),
                      heightReference: HeightReference.RELATIVE_TO_GROUND,
                    }}
                  />
                  {/* Antenna on top */}
                  <Entity
                    position={Cartesian3.fromDegrees(asset.lon, asset.lat, baseAlt + 22)}
                    cylinder={{
                      length: 10,
                      topRadius: 0.5,
                      bottomRadius: 0.5,
                      material: Color.fromCssColorString('#ff8050').withAlpha(0.6),
                      heightReference: HeightReference.RELATIVE_TO_GROUND,
                    }}
                  />
                </>
              )}

              {/* 🏠 Residential — house shape (box + triangular roof) */}
              {asset.type === 'residential' && (
                <>
                  <Entity
                    position={Cartesian3.fromDegrees(asset.lon, asset.lat, baseAlt - 3)}
                    box={{
                      dimensions: new Cartesian3(14, 12, 10),
                      material: Color.fromCssColorString('#8892a4').withAlpha(0.3),
                      outline: true,
                      outlineColor: Color.fromCssColorString('#a0b0c8').withAlpha(0.7),
                      heightReference: HeightReference.RELATIVE_TO_GROUND,
                    }}
                  />
                  {/* Roof */}
                  <Entity
                    position={Cartesian3.fromDegrees(asset.lon, asset.lat, baseAlt + 5)}
                    cylinder={{
                      length: 8,
                      topRadius: 0,
                      bottomRadius: 12,
                      material: Color.fromCssColorString('#a0b0c8').withAlpha(0.35),
                      outline: true,
                      outlineColor: Color.fromCssColorString('#a0b0c8').withAlpha(0.6),
                      slices: 4,
                      heightReference: HeightReference.RELATIVE_TO_GROUND,
                    }}
                  />
                </>
              )}

              {/* ⚡ Substation — golden octahedron */}
              {asset.type === 'substation' && (
                <>
                  <Entity
                    position={Cartesian3.fromDegrees(asset.lon, asset.lat, baseAlt)}
                    ellipsoid={{
                      radii: new Cartesian3(10, 10, 14),
                      material: Color.fromCssColorString('#ffd700').withAlpha(0.3),
                      outline: true,
                      outlineColor: Color.fromCssColorString('#ffe060').withAlpha(0.8),
                      heightReference: HeightReference.RELATIVE_TO_GROUND,
                    }}
                  />
                  {/* Lightning bolt effect — vertical beam */}
                  <Entity
                    position={Cartesian3.fromDegrees(asset.lon, asset.lat, baseAlt + 16)}
                    cylinder={{
                      length: 14,
                      topRadius: 1,
                      bottomRadius: 0.5,
                      material: Color.fromCssColorString('#ffe060').withAlpha(0.6),
                      heightReference: HeightReference.RELATIVE_TO_GROUND,
                    }}
                  />
                </>
              )}

              {/* 💡 Streetlight — lamp post + glow orb */}
              {asset.type === 'streetlight' && (
                <>
                  <Entity
                    position={Cartesian3.fromDegrees(asset.lon, asset.lat, baseAlt * 0.4)}
                    cylinder={{
                      length: baseAlt * 0.8,
                      topRadius: 0.5,
                      bottomRadius: 1,
                      material: Color.fromCssColorString('#888888').withAlpha(0.5),
                      outline: true,
                      outlineColor: Color.fromCssColorString('#fff3a0').withAlpha(0.4),
                      heightReference: HeightReference.RELATIVE_TO_GROUND,
                    }}
                  />
                  <Entity
                    position={Cartesian3.fromDegrees(asset.lon, asset.lat, baseAlt + 2)}
                    ellipsoid={{
                      radii: new Cartesian3(4, 4, 4),
                      material: Color.fromCssColorString('#ffd700').withAlpha(0.6),
                      outline: true,
                      outlineColor: Color.fromCssColorString('#fff3a0').withAlpha(0.9),
                      heightReference: HeightReference.RELATIVE_TO_GROUND,
                    }}
                  />
                </>
              )}

              {/* 🛰️ Satellite — sphere body + solar wing panels + coverage cone */}
              {isSatellite && (
                <>
                  <Entity
                    position={Cartesian3.fromDegrees(asset.lon, asset.lat, baseAlt)}
                    ellipsoid={{
                      radii: new Cartesian3(7, 7, 7),
                      material: Color.fromCssColorString('#00ffee').withAlpha(0.45),
                      outline: true,
                      outlineColor: Color.fromCssColorString('#00f5ff').withAlpha(0.9),
                      heightReference: HeightReference.RELATIVE_TO_GROUND,
                    }}
                  />
                  {/* Left solar wing */}
                  <Entity
                    position={Cartesian3.fromDegrees(asset.lon - 0.0002, asset.lat, baseAlt)}
                    box={{
                      dimensions: new Cartesian3(20, 8, 0.8),
                      material: Color.fromCssColorString('#00bcd4').withAlpha(0.35),
                      outline: true,
                      outlineColor: Color.fromCssColorString('#00f5ff').withAlpha(0.6),
                      heightReference: HeightReference.RELATIVE_TO_GROUND,
                    }}
                  />
                  {/* Right solar wing */}
                  <Entity
                    position={Cartesian3.fromDegrees(asset.lon + 0.0002, asset.lat, baseAlt)}
                    box={{
                      dimensions: new Cartesian3(20, 8, 0.8),
                      material: Color.fromCssColorString('#00bcd4').withAlpha(0.35),
                      outline: true,
                      outlineColor: Color.fromCssColorString('#00f5ff').withAlpha(0.6),
                      heightReference: HeightReference.RELATIVE_TO_GROUND,
                    }}
                  />
                  {/* Coverage footprint */}
                  <Entity
                    position={Cartesian3.fromDegrees(asset.lon, asset.lat, 0)}
                    ellipse={{
                      semiMajorAxis: (asset.liveData.coverageKm ?? 100) * 10,
                      semiMinorAxis: (asset.liveData.coverageKm ?? 100) * 10,
                      material: hColor.withAlpha(0.04),
                      outline: true,
                      outlineColor: hColor.withAlpha(0.2),
                      heightReference: HeightReference.CLAMP_TO_GROUND,
                    }}
                  />
                  {/* Downlink beam */}
                  <Entity
                    position={Cartesian3.fromDegrees(asset.lon, asset.lat, baseAlt * 0.4)}
                    cylinder={{
                      length: baseAlt * 0.8,
                      topRadius: 3,
                      bottomRadius: 30,
                      material: hColor.withAlpha(0.05),
                      outline: true,
                      outlineColor: hColor.withAlpha(0.12),
                      numberOfVerticalLines: 0,
                      heightReference: HeightReference.RELATIVE_TO_GROUND,
                    }}
                  />
                </>
              )}

              {/* ── Floating Data Label ── */}
              <Entity
                position={Cartesian3.fromDegrees(asset.lon, asset.lat, baseAlt + 25)}
                onClick={() => onAssetClick?.(asset)}
                label={{
                  text: formatLiveLabel(asset),
                  font: 'bold 13px Inter, sans-serif',
                  fillColor: hColor.withAlpha(0.95),
                  outlineColor: Color.BLACK,
                  outlineWidth: 3,
                  style: 2,
                  verticalOrigin: VerticalOrigin.BOTTOM,
                  pixelOffset: { x: 0, y: -6 } as any,
                  scaleByDistance: new NearFarScalar(100, 1.4, 10000, 0.3),
                  translucencyByDistance: new NearFarScalar(100, 1, 18000, 0.1),
                  heightReference: HeightReference.RELATIVE_TO_GROUND,
                }}
              />

              {/* ── Status Dot ── */}
              <Entity
                position={Cartesian3.fromDegrees(asset.lon, asset.lat, baseAlt + 20)}
                point={{
                  pixelSize: 10,
                  color: Color.fromCssColorString(
                    asset.liveData.status === 'online'
                      ? '#39ff14'
                      : asset.liveData.status === 'warning'
                        ? '#ffa500'
                        : asset.liveData.status === 'maintenance'
                          ? '#ff6b35'
                          : '#ff0000'
                  ).withAlpha(0.9),
                  outlineColor: Color.BLACK.withAlpha(0.5),
                  outlineWidth: 2,
                  heightReference: HeightReference.RELATIVE_TO_GROUND,
                  scaleByDistance: new NearFarScalar(100, 1.5, 10000, 0.4),
                }}
              />
            </React.Fragment>
          );
        })}

        {/* Energy Flow Lines */}
        {showEnergyFlows && energyFlows.map((flow, idx) => {
          const positions = getFlowPositions(flow.from, flow.to);
          if (!positions) return null;
          return (
            <Entity
              key={`flow-${idx}`}
              polyline={{
                positions,
                width: 3,
                material: new PolylineGlowMaterialProperty({
                  glowPower: 0.3,
                  color: Color.fromCssColorString(flow.color).withAlpha(0.7),
                }),
              }}
            />
          );
        })}
      </Viewer>

      {/* Layer Controls */}
      {!compact && (
        <div className="absolute top-4 right-4 floating-panel p-3 max-h-[500px] overflow-y-auto" style={{ width: '180px' }}>
          <h3 className="text-xs font-semibold text-neon-cyan mb-2 uppercase tracking-wider">Layers</h3>
          <div className="space-y-1">
            {layerTypes.map((layer) => (
              <button
                key={layer.key}
                onClick={() => toggleLayer(layer.key)}
                className={`w-full flex items-center gap-2 px-2 py-1.5 rounded-lg text-xs transition-all ${
                  visibleLayers.has(layer.key)
                    ? 'bg-neon-cyan/10 text-neon-cyan border border-neon-cyan/20'
                    : 'text-text-secondary hover:bg-white/5'
                }`}
              >
                <span>{layer.emoji}</span>
                <span>{layer.label}</span>
              </button>
            ))}
          </div>
          <div className="mt-3 pt-2 border-t border-white/10">
            <h3 className="text-xs font-semibold text-neon-cyan mb-2 uppercase tracking-wider">Map Style</h3>
            <button
              onClick={() => setUseGoogle3D((prev) => !prev)}
              className={`w-full flex items-center justify-between px-2 py-1.5 rounded-lg text-xs transition-all cursor-pointer ${
                useGoogle3D
                  ? 'bg-neon-green/10 text-neon-green border border-neon-green/20 font-semibold'
                  : 'text-text-secondary hover:bg-white/5 border border-transparent'
              }`}
            >
              <span>🌎 Google 3D Tiles</span>
              <span className={`w-2 h-2 rounded-full ${useGoogle3D ? 'bg-neon-green animate-pulse' : 'bg-white/20'}`}></span>
            </button>
          </div>
          <div className="mt-3 pt-2 border-t border-white/10">
            <h3 className="text-xs font-semibold text-neon-cyan mb-2 uppercase tracking-wider">Presets</h3>
            <div className="space-y-1">
              <button onClick={() => flyToLocation(80.2707, 13.0827, 15000)} className="w-full text-left text-xs text-text-secondary hover:text-neon-cyan px-2 py-1 rounded hover:bg-white/5 transition-all">🌆 City Overview</button>
              <button onClick={() => flyToLocation(80.2707, 13.0827, 350, -20)} className="w-full text-left text-xs text-text-secondary hover:text-neon-cyan px-2 py-1 rounded hover:bg-white/5 transition-all">🏢 3D Downtown</button>
              <button onClick={() => flyToLocation(80.2099, 13.0850, 500)} className="w-full text-left text-xs text-text-secondary hover:text-neon-cyan px-2 py-1 rounded hover:bg-white/5 transition-all">☀️ Solar Farm</button>
              <button onClick={() => flyToLocation(80.2335, 12.9815, 500)} className="w-full text-left text-xs text-text-secondary hover:text-neon-cyan px-2 py-1 rounded hover:bg-white/5 transition-all">🏢 IT Corridor</button>
              <button onClick={() => flyToLocation(80.2838, 13.0500, 500)} className="w-full text-left text-xs text-text-secondary hover:text-neon-cyan px-2 py-1 rounded hover:bg-white/5 transition-all">🌬️ Wind Farm</button>
            </div>
          </div>
        </div>
      )}

      {/* Overlay Manager Panel */}
      {!compact && (
        <OverlayManager
          placedAssets={placedAssets}
          onQuickSetup={handleQuickSetup}
          onManualPlaceToggle={handleManualPlaceToggle}
          manualPlaceType={manualPlaceType}
          onRemoveAsset={handleRemoveAsset}
          onFlyToAsset={handleFlyToAsset}
          onClearAll={handleClearAll}
        />
      )}

      {/* Map Legend */}
      {!compact && (
        <div className="absolute bottom-4 right-4 floating-panel p-3" style={{ width: '200px' }}>
          <h3 className="text-xs font-semibold text-neon-cyan mb-2 uppercase tracking-wider">Energy Flow</h3>
          <div className="space-y-1.5 text-xs">
            <div className="flex items-center gap-2">
              <div className="w-6 h-0.5 bg-[#39ff14] rounded"></div>
              <span className="text-text-secondary">Renewable</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-6 h-0.5 bg-[#4361ee] rounded"></div>
              <span className="text-text-secondary">Battery</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-6 h-0.5 bg-[#ff6b35] rounded"></div>
              <span className="text-text-secondary">Grid</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-6 h-0.5 bg-[#ff0844] rounded"></div>
              <span className="text-text-secondary">Overload</span>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default CityMap;
