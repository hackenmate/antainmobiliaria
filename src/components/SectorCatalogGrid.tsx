import { ArrowRight, Bookmark, MapPin } from 'lucide-react';
import { SECTORS, type SectorId } from '../data/properties';

interface SectorCatalogGridProps {
  activeSector: SectorId;
  currency: 'USD' | 'PEN';
  fxRate: number;
  savedSectors: SectorId[];
  onSelectSector: (sector: SectorId) => void;
  onToggleSaveSector: (sector: SectorId) => void;
  onInspectOnMap: (sector: SectorId) => void;
}

export function SectorCatalogGrid({
  activeSector,
  currency,
  fxRate,
  savedSectors,
  onSelectSector,
  onToggleSaveSector,
  onInspectOnMap,
}: SectorCatalogGridProps) {
  const sectorIds = Object.keys(SECTORS) as SectorId[];

  return (
    <div className="sector-catalog-wrap">
      <div className="sector-catalog-header">
        <div>
          <div className="eyebrow-rule-row">
            <span className="eyebrow-text">Sectores disponibles en Anta</span>
            <span className="eyebrow-rule" aria-hidden="true" />
          </div>
          <h2 className="section-title">
            Compara cada sector del valle antes de cotizar.
          </h2>
        </div>
        <p className="sector-catalog-sub">
          Tres ubicaciones reales verificadas en campo, con acceso carrozable y
          metrajes configurables desde 350 m² hasta 1,200 m².
        </p>
      </div>

      <div className="sector-cards-grid">
        {sectorIds.map((sid) => {
          const item = SECTORS[sid];
          const isSelected = activeSector === sid;
          const isSaved = savedSectors.includes(sid);
          const displayPrice =
            currency === 'USD'
              ? `USD ${item.pricePerSqmUsd}/m²`
              : `S/ ${Math.round(item.pricePerSqmUsd * fxRate)}/m²`;

          return (
            <article
              key={sid}
              className={`sector-catalog-card${isSelected ? ' is-selected' : ''}`}
            >
              <div className="sector-card-media">
                <img
                  src={item.image}
                  alt={item.alt}
                  loading="lazy"
                  decoding="async"
                  referrerPolicy="no-referrer"
                  className="sector-card-img"
                />
                <button
                  type="button"
                  className={`sector-save-btn${isSaved ? ' is-saved' : ''}`}
                  aria-label={
                    isSaved
                      ? `Quitar ${item.shortName} de favoritos`
                      : `Guardar ${item.shortName} en mi dossier`
                  }
                  aria-pressed={isSaved}
                  onClick={() => onToggleSaveSector(sid)}
                >
                  <Bookmark
                    size={15}
                    strokeWidth={2}
                    fill={isSaved ? 'currentColor' : 'none'}
                  />
                </button>
              </div>

              <div className="sector-card-body">
                <div className="sector-card-meta">
                  <span>{item.district}</span>
                  <span aria-hidden="true">·</span>
                  <span className="tabular-nums">{item.elevation}</span>
                </div>

                <h3 className="sector-card-title">{item.name}</h3>

                <p className="sector-card-price tabular-nums">
                  Desde {displayPrice}
                </p>

                <p className="sector-card-desc">{item.headline}</p>

                <div className="sector-card-specs tabular-nums">
                  <span>350 – 1,200 m²</span>
                  <span aria-hidden="true">·</span>
                  <span>Partida SUNARP</span>
                </div>

                <div className="sector-card-actions">
                  <button
                    type="button"
                    className={`btn btn-sm ${
                      isSelected ? 'btn-primary' : 'btn-outline'
                    }`}
                    onClick={() => onSelectSector(sid)}
                  >
                    <span>
                      {isSelected ? 'Sector en cotizador' : 'Cotizar sector'}
                    </span>
                    <ArrowRight size={14} strokeWidth={2} />
                  </button>

                  <button
                    type="button"
                    className="sector-map-link"
                    onClick={() => onInspectOnMap(sid)}
                  >
                    <MapPin size={14} strokeWidth={1.9} />
                    <span>Ver mapa</span>
                  </button>
                </div>
              </div>
            </article>
          );
        })}
      </div>
    </div>
  );
}
