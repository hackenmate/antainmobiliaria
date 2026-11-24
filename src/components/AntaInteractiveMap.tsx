/// <reference types="google.maps" />
import { useCallback, useEffect, useRef, useState } from 'react';
import {
  APIProvider,
  APILoadingStatus,
  AdvancedMarker,
  InfoWindow,
  Map as GoogleMap,
  Pin,
  useApiLoadingStatus,
  useMap,
  useMapsLibrary,
} from '@vis.gl/react-google-maps';
import { Compass, MapPin, Navigation, Route as RouteIcon } from 'lucide-react';
import { ROUTE_ORIGINS, SECTORS, type SectorId } from '../data/properties';

const MAPS_API_KEY = import.meta.env.VITE_GOOGLE_MAPS_API_KEY || '';

interface NearbyPlaceItem {
  id: string;
  name: string;
  address: string;
  typeLabel: string;
  location: { lat: number; lng: number };
  mapsUri?: string;
}

interface RouteSummary {
  distanceKm: string;
  durationMin: number;
  originLabel: string;
}

interface AntaInteractiveMapProps {
  activeSector: SectorId;
  onSelectSector: (sector: SectorId) => void;
  onConfigureSector: (sector: SectorId) => void;
}

function useAdvancedMarkerRef() {
  const [marker, setMarker] =
    useState<google.maps.marker.AdvancedMarkerElement | null>(null);
  const refCallback = useCallback(
    (m: google.maps.marker.AdvancedMarkerElement | null) => {
      setMarker(m);
    },
    []
  );
  return [refCallback, marker] as const;
}

function SectorMarker({
  sectorId,
  isSelected,
  onSelect,
  onConfigure,
}: {
  sectorId: SectorId;
  isSelected: boolean;
  onSelect: (id: SectorId) => void;
  onConfigure: (id: SectorId) => void;
}) {
  const sector = SECTORS[sectorId];
  const [markerRef, marker] = useAdvancedMarkerRef();
  const [open, setOpen] = useState(false);

  return (
    <>
      <AdvancedMarker
        ref={markerRef}
        position={sector.coordinates}
        title={`${sector.name} — ${sector.elevation}`}
        zIndex={isSelected ? 1000 : 10}
        onClick={() => {
          onSelect(sectorId);
          setOpen(true);
        }}
      >
        <Pin
          background={isSelected ? '#570A20' : '#B9A58C'}
          borderColor={isSelected ? '#F5F3F0' : '#570A20'}
          glyphColor={isSelected ? '#F5F3F0' : '#1F1B1C'}
          scale={isSelected ? 1.22 : 1.0}
        />
      </AdvancedMarker>

      {open && marker && (
        <InfoWindow
          anchor={marker}
          pixelOffset={[0, -6]}
          onCloseClick={() => setOpen(false)}
        >
          <div className="map-infowindow">
            <div className="map-iw-kicker">
              {sector.district} · {sector.elevation}
            </div>
            <h4 className="map-iw-title">{sector.name}</h4>
            <p className="map-iw-desc">{sector.headline}</p>
            <div className="map-iw-footer">
              <span className="map-iw-price">
                Desde USD {sector.pricePerSqmUsd}/m²
              </span>
              <button
                type="button"
                className="map-iw-btn"
                onClick={() => {
                  onConfigure(sectorId);
                  setOpen(false);
                }}
              >
                Cotizar lote
              </button>
            </div>
          </div>
        </InfoWindow>
      )}
    </>
  );
}

function RouteAndPlacesController({
  activeSector,
  originId,
  showRoute,
  onRouteComputed,
  onRouteError,
  onPlacesLoaded,
  onPlacesError,
}: {
  activeSector: SectorId;
  originId: string;
  showRoute: boolean;
  onRouteComputed: (summary: RouteSummary | null) => void;
  onRouteError: (msg: string | null) => void;
  onPlacesLoaded: (places: NearbyPlaceItem[]) => void;
  onPlacesError: (msg: string | null) => void;
}) {
  const map = useMap();
  const routesLib = useMapsLibrary('routes');
  const placesLib = useMapsLibrary('places');
  const polylinesRef = useRef<google.maps.Polyline[]>([]);
  const [nearbyPlaces, setNearbyPlaces] = useState<NearbyPlaceItem[]>([]);

  // Center map smoothly when active sector changes (if route isn't overriding bounds)
  useEffect(() => {
    if (!map || showRoute) return;
    const target = SECTORS[activeSector].coordinates;
    map.panTo(target);
    map.setZoom(13);
  }, [map, activeSector, showRoute]);

  // Compute driving route via modern Routes API (Route.computeRoutes)
  useEffect(() => {
    polylinesRef.current.forEach((p) => p.setMap(null));
    polylinesRef.current = [];

    if (!showRoute || !routesLib || !map) {
      onRouteComputed(null);
      return;
    }

    const originObj =
      ROUTE_ORIGINS.find((o) => o.id === originId) || ROUTE_ORIGINS[0];
    const dest = SECTORS[activeSector].coordinates;
    let cancelled = false;

    const compute = async () => {
      onRouteError(null);
      try {
        const RouteClass = routesLib.Route as unknown as {
          computeRoutes: (req: Record<string, unknown>) => Promise<{
            routes?: Array<{
              distanceMeters?: number;
              durationMillis?: number;
              viewport?: google.maps.LatLngBounds;
              createPolylines: () => google.maps.Polyline[];
            }>;
          }>;
        };

        const response = await RouteClass.computeRoutes({
          origin: originObj.coords,
          destination: dest,
          travelMode: 'DRIVING',
          fields: ['path', 'distanceMeters', 'durationMillis', 'viewport'],
        });

        if (cancelled) return;
        const primaryRoute = response?.routes?.[0];
        if (!primaryRoute) {
          onRouteError('No se encontró una ruta disponible.');
          onRouteComputed(null);
          return;
        }

        const newPolylines = primaryRoute.createPolylines();
        newPolylines.forEach((polyline) => {
          polyline.setOptions({
            strokeColor: '#570A20',
            strokeWeight: 5,
            strokeOpacity: 0.92,
          });
          polyline.setMap(map);
        });
        polylinesRef.current = newPolylines;

        if (primaryRoute.viewport) {
          map.fitBounds(primaryRoute.viewport);
        }

        const distKm = ((primaryRoute.distanceMeters ?? 0) / 1000).toFixed(1);
        const durMin = Math.max(
          1,
          Math.round((primaryRoute.durationMillis ?? 0) / 60000)
        );
        onRouteComputed({
          distanceKm: distKm,
          durationMin: durMin,
          originLabel: originObj.label,
        });
      } catch (err: unknown) {
        if (cancelled) return;
        const msg = err instanceof Error ? err.message : String(err);
        if (
          msg.includes('RESOURCE_EXHAUSTED') ||
          msg.includes('OVER_QUERY_LIMIT') ||
          msg.includes('Quota')
        ) {
          window.dispatchEvent(new CustomEvent('gmp-quota-exceeded'));
        }
        onRouteError('No se pudo calcular la ruta en este momento.');
        onRouteComputed(null);
      }
    };

    void compute();

    return () => {
      cancelled = true;
      polylinesRef.current.forEach((p) => p.setMap(null));
      polylinesRef.current = [];
    };
  }, [
    routesLib,
    map,
    activeSector,
    originId,
    showRoute,
    onRouteComputed,
    onRouteError,
  ]);

  // Discover real nearby services via Places API (New) searchNearby
  useEffect(() => {
    if (!placesLib) return;
    let cancelled = false;
    const target = SECTORS[activeSector].coordinates;

    const loadNearby = async () => {
      onPlacesError(null);
      try {
        const PlaceClass = placesLib.Place as unknown as {
          searchNearby: (req: Record<string, unknown>) => Promise<{
            places?: Array<{
              id?: string;
              displayName?: string;
              formattedAddress?: string;
              primaryTypeDisplayName?: string;
              location?: { lat: () => number; lng: () => number };
              googleMapsURI?: string;
            }>;
          }>;
        };

        const { places } = await PlaceClass.searchNearby({
          fields: [
            'id',
            'displayName',
            'formattedAddress',
            'location',
            'primaryTypeDisplayName',
            'googleMapsURI',
          ],
          locationRestriction: {
            center: target,
            radius: 4500,
          },
          maxResultCount: 5,
        });

        if (cancelled) return;
        const mapped: NearbyPlaceItem[] = (places ?? [])
          .filter((p) => p.location && p.displayName)
          .map((p, idx) => ({
            id: p.id || `place-${idx}`,
            name: p.displayName || 'Servicio cercano',
            address: p.formattedAddress || 'Provincia de Anta, Cusco',
            typeLabel: p.primaryTypeDisplayName || 'Entorno cercano',
            location: {
              lat: p.location!.lat(),
              lng: p.location!.lng(),
            },
            mapsUri: p.googleMapsURI,
          }));

        setNearbyPlaces(mapped);
        onPlacesLoaded(mapped);
      } catch (err: unknown) {
        if (cancelled) return;
        const msg = err instanceof Error ? err.message : String(err);
        if (
          msg.includes('RESOURCE_EXHAUSTED') ||
          msg.includes('OVER_QUERY_LIMIT') ||
          msg.includes('Quota')
        ) {
          window.dispatchEvent(new CustomEvent('gmp-quota-exceeded'));
        }
        setNearbyPlaces([]);
        onPlacesLoaded([]);
        onPlacesError('No se pudieron consultar servicios cercanos ahora.');
      }
    };

    void loadNearby();

    return () => {
      cancelled = true;
    };
  }, [placesLib, activeSector, onPlacesLoaded, onPlacesError]);

  return (
    <>
      {nearbyPlaces.map((place) => (
        <AdvancedMarker
          key={place.id}
          position={place.location}
          title={place.name}
          zIndex={5}
        >
          <Pin
            background="#F5F3F0"
            borderColor="#570A20"
            glyphColor="#570A20"
            scale={0.78}
          />
        </AdvancedMarker>
      ))}
    </>
  );
}

function MapStatusMonitor() {
  const status = useApiLoadingStatus();
  if (
    status === APILoadingStatus.FAILED ||
    status === APILoadingStatus.AUTH_FAILURE
  ) {
    return (
      <div className="map-status-banner">
        No se pudo autenticar Google Maps en este entorno. Verifica la cuota o
        restricciones de tu clave API.
      </div>
    );
  }
  return null;
}

export function AntaInteractiveMap({
  activeSector,
  onSelectSector,
  onConfigureSector,
}: AntaInteractiveMapProps) {
  const [mapTypeId, setMapTypeId] = useState<'hybrid' | 'terrain' | 'roadmap'>(
    'hybrid'
  );
  const [originId, setOriginId] = useState<string>('cusco');
  const [showRoute, setShowRoute] = useState<boolean>(false);
  const [routeSummary, setRouteSummary] = useState<RouteSummary | null>(null);
  const [routeError, setRouteError] = useState<string | null>(null);
  const [nearbyPlaces, setNearbyPlaces] = useState<NearbyPlaceItem[]>([]);
  const [placesError, setPlacesError] = useState<string | null>(null);

  const activeInfo = SECTORS[activeSector];

  return (
    <section id="mapa" className="map-section">
      <div className="container">
        <div className="map-header-row">
          <div>
            <span className="eyebrow-text">
              Geolocalización en tiempo real · Provincia de Anta, Cusco
            </span>
            <h2 className="section-title">Ubicación y conectividad vial.</h2>
          </div>

          <div
            className="segmented-control map-type-control"
            role="tablist"
            aria-label="Tipo de mapa"
          >
            {(
              [
                { id: 'hybrid', label: 'Satélite' },
                { id: 'terrain', label: 'Relieve' },
                { id: 'roadmap', label: 'Vial' },
              ] as const
            ).map((mode) => (
              <button
                key={mode.id}
                type="button"
                role="tab"
                aria-selected={mapTypeId === mode.id}
                className={`seg-btn${mapTypeId === mode.id ? ' is-active' : ''}`}
                onClick={() => setMapTypeId(mode.id)}
              >
                {mode.label}
              </button>
            ))}
          </div>
        </div>

        <div className="map-layout-grid">
          <div className="map-canvas-shell">
            {MAPS_API_KEY ? (
              <APIProvider
                apiKey={MAPS_API_KEY}
                language="es"
                region="PE"
                libraries={['marker', 'places', 'routes']}
              >
                <MapStatusMonitor />
                <GoogleMap
                  mapId="DEMO_MAP_ID"
                  defaultCenter={activeInfo.coordinates}
                  defaultZoom={13}
                  mapTypeId={mapTypeId}
                  gestureHandling="greedy"
                  streetViewControl={false}
                  mapTypeControl={false}
                  internalUsageAttributionIds={[
                    'gmp_mcp_codeassist_v1_aistudio',
                  ]}
                  style={{ width: '100%', height: '100%' }}
                >
                  {(Object.keys(SECTORS) as SectorId[]).map((sid) => (
                    <SectorMarker
                      key={sid}
                      sectorId={sid}
                      isSelected={activeSector === sid}
                      onSelect={onSelectSector}
                      onConfigure={onConfigureSector}
                    />
                  ))}
                  <RouteAndPlacesController
                    activeSector={activeSector}
                    originId={originId}
                    showRoute={showRoute}
                    onRouteComputed={setRouteSummary}
                    onRouteError={setRouteError}
                    onPlacesLoaded={setNearbyPlaces}
                    onPlacesError={setPlacesError}
                  />
                </GoogleMap>
              </APIProvider>
            ) : (
              <div className="map-fallback-shell">
                <Compass size={32} strokeWidth={1.5} />
                <h3>Mapa interactivo de Anta, Cusco</h3>
                <p>
                  Configura <code>VITE_GOOGLE_MAPS_API_KEY</code> en el entorno
                  para activar el mapa satelital, cálculo de rutas y entorno de
                  lugares cercanos.
                </p>
              </div>
            )}
          </div>

          <aside className="map-sidebar">
            <div className="map-sector-tabs" role="tablist" aria-label="Sectores de Anta">
              {(Object.keys(SECTORS) as SectorId[]).map((sid) => {
                const sec = SECTORS[sid];
                return (
                  <button
                    key={sid}
                    type="button"
                    role="tab"
                    aria-selected={activeSector === sid}
                    className={`sector-tab-btn${activeSector === sid ? ' is-active' : ''}`}
                    onClick={() => onSelectSector(sid)}
                  >
                    <span
                      className="swatch-dot"
                      style={{ background: sec.dotColor }}
                    />
                    <span>{sec.shortName}</span>
                  </button>
                );
              })}
            </div>

            <div className="map-sector-card">
              <div className="meta-line">
                <span>{activeInfo.district}</span>
                <span aria-hidden="true">·</span>
                <span className="tabular-nums">{activeInfo.elevation}</span>
              </div>
              <h3 className="map-card-title">{activeInfo.name}</h3>
              <p className="map-card-desc">{activeInfo.description}</p>
              <div className="map-card-metrics">
                <div>
                  <span className="metric-label">Valor referencial</span>
                  <strong className="metric-num tabular-nums">
                    USD {activeInfo.pricePerSqmUsd}/m²
                  </strong>
                </div>
                <div>
                  <span className="metric-label">Coordenadas</span>
                  <strong className="metric-num tabular-nums">
                    {activeInfo.coordinates.lat.toFixed(4)},{' '}
                    {activeInfo.coordinates.lng.toFixed(4)}
                  </strong>
                </div>
              </div>
            </div>

            <div className="map-route-box">
              <div className="map-box-heading">
                <RouteIcon size={16} strokeWidth={1.8} />
                <span>Tiempo de traslado por carretera</span>
              </div>

              <div className="route-origin-row">
                {ROUTE_ORIGINS.map((orig) => (
                  <button
                    key={orig.id}
                    type="button"
                    className={`route-origin-btn${originId === orig.id ? ' is-active' : ''}`}
                    onClick={() => {
                      setOriginId(orig.id);
                      setShowRoute(true);
                    }}
                  >
                    {orig.label}
                  </button>
                ))}
              </div>

              <button
                type="button"
                className="btn btn-primary btn-sm btn-full"
                onClick={() => setShowRoute((prev) => !prev)}
              >
                <Navigation size={15} strokeWidth={1.8} />
                <span>
                  {showRoute
                    ? 'Ocultar ruta en el mapa'
                    : `Trazar ruta hasta ${activeInfo.shortName}`}
                </span>
              </button>

              {routeSummary && (
                <div className="route-result-row">
                  <span>Desde {routeSummary.originLabel}</span>
                  <strong className="tabular-nums">
                    {routeSummary.distanceKm} km · {routeSummary.durationMin} min
                  </strong>
                </div>
              )}
              {routeError && <p className="map-inline-note">{routeError}</p>}
            </div>

            <div className="map-nearby-box">
              <div className="map-box-heading">
                <MapPin size={16} strokeWidth={1.8} />
                <span>Entorno cercano (Google Places)</span>
              </div>

              {nearbyPlaces.length > 0 ? (
                <ul className="nearby-list">
                  {nearbyPlaces.map((place) => (
                    <li key={place.id} className="nearby-item">
                      <div className="nearby-item-main">
                        <span className="nearby-name">{place.name}</span>
                        <span className="nearby-meta">
                          {place.typeLabel} · {place.address}
                        </span>
                      </div>
                      {place.mapsUri && (
                        <a
                          href={place.mapsUri}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="nearby-link"
                        >
                          Ver
                        </a>
                      )}
                    </li>
                  ))}
                </ul>
              ) : (
                <p className="map-inline-note">
                  {placesError ||
                    'Consultando puntos de referencia del distrito...'}
                </p>
              )}
            </div>
          </aside>
        </div>
      </div>
    </section>
  );
}
