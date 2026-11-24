import { useState } from 'react';
import { ArrowUpRight, CalendarCheck, Compass } from 'lucide-react';
import type { AgentName, SectorId } from '../data/properties';
import izcuchacaClientPhoto from '../assets/images/testimonial_family_izcuchaca_1795036865959.jpg';
import zuriteClientPhoto from '../assets/images/testimonial_family_zurite_1795036867134.jpg';
import huarocondoClientPhoto from '../assets/images/testimonial_owner_huarocondo_1795036866622.jpg';

interface TestimonialsSectionProps {
  onConfigureParcel: (sector: SectorId, areaSqm: number) => void;
  onScheduleWithAgent: (agent: AgentName) => void;
}

interface ClientStory {
  id: string;
  clients: string;
  occupation: string;
  sector: SectorId;
  sectorLabel: string;
  areaSqm: number;
  acquiredAt: string;
  closingDays: string;
  advisor: AgentName;
  headline: string;
  quote: string;
  story: string;
  image: string;
  alt: string;
}

const CLIENT_STORIES: ClientStory[] = [
  {
    id: 'story-izcuchaca',
    clients: 'Mateo & Valeria Quispe',
    occupation: 'Estudio de Arquitectura Qori · Cusco',
    sector: 'izcuchaca',
    sectorLabel: 'Valle de Izcuchaca',
    areaSqm: 600,
    acquiredAt: 'Mayo 2026',
    closingDays: '18 días en notaría',
    advisor: 'Alison Mariano',
    headline: 'De revisar la ortofoto al trazo de nuestra casa taller',
    quote:
      '«Nos mostraron la partida SUNARP y los linderos exactos en la primera reunión; no hubo letra pequeña ni demoras.»',
    story:
      'Buscaban 600 m² planos junto al corredor Cusco – Chinchero sin superposición comunal. Con el estudio registral previo de Alison Mariano y la verificación en campo de los hitos bajo los eucaliptos, firmaron escritura pública en 18 días y hoy proyectan su vivienda taller.',
    image: izcuchacaClientPhoto,
    alt: 'Mateo y Valeria Quispe sosteniendo planos arquitectónicos en su terreno plano rodeado de eucaliptos en Izcuchaca, Anta',
  },
  {
    id: 'story-zurite',
    clients: 'Julián & Rosaura Condori',
    occupation: 'Productores agroecológicos · Anta',
    sector: 'zurite',
    sectorLabel: 'Laderas de Zurite',
    areaSqm: 1200,
    acquiredAt: 'Julio 2026',
    closingDays: '21 días en notaría',
    advisor: 'José Luis',
    headline: 'Topografía comprobada a pie y acceso carrozable real',
    quote:
      '«Caminamos la pirca de piedra al atardecer con José Luis y supimos al instante dónde ubicar el reservorio y la casa.»',
    story:
      'Necesitaban una estancia amplia con buen drenaje natural y frente afirmado cerca del hito de Zurite. El sobrevuelo en dron 4K y la visita técnica con José Luis confirmaron el asoleamiento de toda la tarde y cerraron la compra de 1,200 m² con título independiente.',
    image: zuriteClientPhoto,
    alt: 'Julián Condori junto a su hija revisando el plano topográfico de su parcela frente a una pirca de piedra y andenes en Zurite, Anta',
  },
  {
    id: 'story-huarocondo',
    clients: 'Dra. Lucía Paredes Huamán',
    occupation: 'Médica de salud pública · Cusco',
    sector: 'huarocondo',
    sectorLabel: 'Mirador Huarocondo',
    areaSqm: 350,
    acquiredAt: 'Septiembre 2026',
    closingDays: '15 días en notaría',
    advisor: 'Alison Mariano',
    headline: 'Refugio silencioso a 25 minutos de Cusco frente a la cordillera',
    quote:
      '«Compré sin estrés mientras seguía mis guardias en hospital; cada documento llegó visado y listo para firmar.»',
    story:
      'Quería una parcela manejable de 350 m² con vista despejada a los nevados para desconectar los fines de semana. Comparó las curvas de nivel en el mapa interactivo, recorrió la ladera junto a nuestro equipo y concretó su escritura en dos semanas.',
    image: huarocondoClientPhoto,
    alt: 'La doctora Lucía Paredes de pie en su lote panorámico de Mirador Huarocondo con terrazas agrícolas y nevados al fondo',
  },
];

type FilterSector = 'all' | SectorId;

const FILTER_TABS: { id: FilterSector; label: string }[] = [
  { id: 'all', label: 'Todos los sectores (3)' },
  { id: 'izcuchaca', label: 'Izcuchaca' },
  { id: 'zurite', label: 'Zurite' },
  { id: 'huarocondo', label: 'Huarocondo' },
];

export function TestimonialsSection({
  onConfigureParcel,
  onScheduleWithAgent,
}: TestimonialsSectionProps) {
  const [sectorFilter, setSectorFilter] = useState<FilterSector>('all');

  const visibleStories =
    sectorFilter === 'all'
      ? CLIENT_STORIES
      : CLIENT_STORIES.filter((item) => item.sector === sectorFilter);

  return (
    <section id="testimonios" className="testimonials-section">
      <div className="container">
        <div className="testimonials-header">
          <div className="testimonials-title-wrap">
            <div className="eyebrow-rule-row">
              <span className="eyebrow-text">
                Propietarios ALASO · Operaciones cerradas en Anta
              </span>
              <span className="eyebrow-rule" aria-hidden="true" />
            </div>
            <h2 className="section-title">
              Historias reales de quienes ya construyen en el valle.
            </h2>
            <p className="testimonials-sub">
              Cada testimonio corresponde a parcelas independizadas y verificadas
              en terreno con acompañamiento directo de nuestros directores desde
              la primera visita hasta la inscripción en SUNARP Cusco.
            </p>
          </div>

          <div className="testimonials-proof-metrics">
            <div className="metric-item">
              <span className="metric-value tabular-nums">18 días</span>
              <span className="metric-label">Promedio cierre notarial</span>
            </div>
            <div className="metric-item">
              <span className="metric-value tabular-nums">100%</span>
              <span className="metric-label">Partida independiente</span>
            </div>
            <div className="metric-item">
              <span className="metric-value tabular-nums">3 sectores</span>
              <span className="metric-label">Entregas en Anta</span>
            </div>
          </div>
        </div>

        <div
          className="testimonials-filter-bar"
          role="tablist"
          aria-label="Filtrar testimonios por sector de Anta"
        >
          {FILTER_TABS.map((tab) => {
            const isActive = sectorFilter === tab.id;
            return (
              <button
                key={tab.id}
                type="button"
                role="tab"
                aria-selected={isActive}
                className={`studio-filter-btn${isActive ? ' is-active' : ''}`}
                onClick={() => setSectorFilter(tab.id)}
              >
                {tab.label}
              </button>
            );
          })}
        </div>

        <div
          className={`testimonials-grid${
            visibleStories.length === 1 ? ' is-single' : ''
          }`}
        >
          {visibleStories.map((item) => (
            <article
              key={item.id}
              className={`testimonial-card${
                visibleStories.length === 1 ? ' is-featured' : ''
              }`}
            >
              <div className="testimonial-photo-wrap">
                <img
                  src={item.image}
                  alt={item.alt}
                  loading="lazy"
                  decoding="async"
                  referrerPolicy="no-referrer"
                  className="testimonial-photo-img"
                />
              </div>

              <div className="testimonial-body">
                <div className="testimonial-meta-line">
                  <span>{item.sectorLabel}</span>
                  <span aria-hidden="true">·</span>
                  <span className="tabular-nums">{item.areaSqm} m²</span>
                  <span aria-hidden="true">·</span>
                  <span>{item.acquiredAt}</span>
                </div>

                <h3 className="testimonial-headline">{item.headline}</h3>
                <p className="testimonial-story">{item.story}</p>

                <blockquote className="testimonial-quote">
                  {item.quote}
                </blockquote>

                <div className="testimonial-author-row">
                  <div>
                    <p className="testimonial-client-name">{item.clients}</p>
                    <p className="testimonial-client-role">
                      {item.occupation}
                    </p>
                  </div>
                  <div className="testimonial-advisor-note tabular-nums">
                    <Compass size={14} strokeWidth={1.8} />
                    <span>
                      {item.closingDays} · {item.advisor}
                    </span>
                  </div>
                </div>

                <div className="testimonial-actions">
                  <button
                    type="button"
                    className="btn btn-primary btn-sm"
                    onClick={() => onConfigureParcel(item.sector, item.areaSqm)}
                  >
                    <span>Cotizar {item.sectorLabel.split(' ').pop()}</span>
                    <ArrowUpRight size={15} strokeWidth={1.9} />
                  </button>
                  <button
                    type="button"
                    className="btn btn-outline btn-sm"
                    onClick={() => onScheduleWithAgent(item.advisor)}
                  >
                    <CalendarCheck size={15} strokeWidth={1.9} />
                    <span>Consultar con {item.advisor}</span>
                  </button>
                </div>
              </div>
            </article>
          ))}
        </div>
      </div>
    </section>
  );
}
