import { useState } from 'react';
import { CalendarCheck, Compass } from 'lucide-react';
import type { AgentName } from '../data/properties';
import { BrandEmblem } from './BrandEmblem';
import alisonPortrait from '../assets/images/agent_alison_mariano_man_1795038930516.jpg';
import joseLuisPortrait from '../assets/images/agent_jose_luis_1795029238283.jpg';

interface BrandStorySectionProps {
  selectedAgent: AgentName;
  onScheduleWithAgent: (agent: AgentName) => void;
}

interface EmblemPart {
  id: 'leaf' | 'apu' | 'home' | 'terraces';
  label: string;
  role: string;
  meaning: string;
}

const EMBLEM_PARTS: EmblemPart[] = [
  {
    id: 'leaf',
    label: 'La Hoja Andina',
    role: 'Custodia ecológica y bosques de eucalipto',
    meaning:
      'Representa el respeto por las cortinas arbóreas, el microclima de Anta y el aprovechamiento agrícola sostenible sin urbanización agresiva.',
  },
  {
    id: 'apu',
    label: 'Silueta del Apu',
    role: 'Topografía real a 3,345 m s.n.m.',
    meaning:
      'Evoca la cordillera tutelar que protege la Pampa de Anta y recuerda nuestra regla constructiva: diseñar siempre a favor de la pendiente natural.',
  },
  {
    id: 'home',
    label: 'Estancia de Dos Aguas',
    role: 'Arquitectura contemporánea en diálogo andino',
    meaning:
      'Simboliza la vivienda honesta de piedra, madera y grandes paños de luz pensada como refugio familiar o inversión patrimonial duradera.',
  },
  {
    id: 'terraces',
    label: 'Andenes del Valle',
    role: 'Parcelación orgánica y valor del suelo',
    meaning:
      'Franjas curvas inspiradas en la andenería cusqueña que reflejan la transición entre bosque profundo, campiña fértil, luz solar de altura y arcilla andina.',
  },
];

const BRAND_PILLARS = [
  {
    num: '01.',
    title: 'Curaduría Jurídica SUNARP',
    detail:
      'Cada propiedad atraviesa un estudio registral y catastral previo: partidas independientes inscritas en Cusco, linderos verificados y cero superposición arqueológica o comunal.',
  },
  {
    num: '02.',
    title: 'Trabajar con la Pendiente',
    detail:
      'Inspirados en las inmobiliarias boutique del Valle Sagrado, trazamos lotes orgánicos con frente a vía afirmada y drenaje natural, preservando la vista limpia hacia los cerros.',
  },
  {
    num: '03.',
    title: 'Evidencia Audiovisual Real',
    detail:
      'Documentamos cada predio con vuelos en dron 4K y ortofotos de campo para que tomes decisiones sobre terreno real antes y durante tu visita presencial en Anta.',
  },
];

interface AdvisorProfile {
  name: AgentName;
  role: string;
  focus: string;
  bio: string;
  ethos: string;
  territory: string;
  image: string;
  alt: string;
}

const ADVISORS: AdvisorProfile[] = [
  {
    name: 'Alison Mariano',
    role: 'Socio Director · Curaduría Patrimonial y Saneamiento Legal',
    focus: 'Due Diligence Registral · SUNARP Cusco',
    bio: 'Especialista en estructuración jurídica e inversión inmobiliaria en el eje Cusco – Anta – Chinchero. Acompaña personalmente cada operación desde la revisión de partida registral hasta la firma notarial, garantizando claridad absoluta para familias e inversionistas.',
    ethos:
      '«La plusvalía real empieza en la tranquilidad legal: ningún paisaje vale la pena si el título no está impecable desde el primer día.»',
    territory: 'Valle de Izcuchaca · Corredor Cusco – Chinchero',
    image: alisonPortrait,
    alt: 'Alison Mariano, socio director de Realty Anta Terra, sosteniendo planos topográficos frente a un pabellón de piedra y vidrio en Cusco',
  },
  {
    name: 'José Luis',
    role: 'Director de Campo · Topografía, Dron 4K y Desarrollo Territorial',
    focus: 'Fotogrametría Aérea · Factibilidad y Accesos',
    bio: 'Responsable del reconocimiento técnico en terreno, levantamientos topográficos georreferenciados y diseño de lotización orgánica. Guía las visitas presenciales mostrando linderos reales, orientación solar, accesibilidad vial y potencial constructivo de cada parcela.',
    ethos:
      '«Caminar el lote al atardecer revela lo que un plano plano oculta: por dónde corre el viento, dónde nace la vista y cómo emplazar la casa.»',
    territory: 'Laderas de Zurite · Mirador Huarocondo',
    image: joseLuisPortrait,
    alt: 'José Luis, director de campo de Realty Anta Terra, observando el valle andino con mapas topográficos en Anta, Cusco',
  },
];

export function BrandStorySection({
  selectedAgent,
  onScheduleWithAgent,
}: BrandStorySectionProps) {
  const [activePartId, setActivePartId] = useState<EmblemPart['id']>('leaf');

  const activePart =
    EMBLEM_PARTS.find((p) => p.id === activePartId) ?? EMBLEM_PARTS[0];

  return (
    <section id="historia" className="brand-story-section">
      <div className="container">
        {/* Part 1: Brand Origin Story & Logo Meaning */}
        <div className="brand-story-grid">
          <div className="brand-manifesto">
            <span className="eyebrow-text">
              Identidad de marca · Nacida en la Pampa de Anta
            </span>
            <h2 className="section-title">
              Más que lotes: custodia de tierra y paisaje andino.
            </h2>
            <p className="brand-lead">
              Realty Anta Terra surge como una firma inmobiliaria boutique
              dedicada exclusivamente a la provincia de Anta, a 25 minutos del
              Cusco y en la puerta estratégica hacia el Valle Sagrado y
              Chinchero. No operamos como intermediarios de volumen: curamos
              paños de tierra con historia agrícola, respaldo legal verificable y
              vocación arquitectónica.
            </p>

            <div className="brand-pillars-list">
              {BRAND_PILLARS.map((pillar) => (
                <div key={pillar.num} className="brand-pillar-row">
                  <span className="brand-pillar-num tabular-nums">
                    {pillar.num}
                  </span>
                  <div>
                    <h3 className="brand-pillar-title">{pillar.title}</h3>
                    <p className="brand-pillar-detail">{pillar.detail}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>

          <aside className="brand-emblem-panel">
            <div className="brand-emblem-stage">
              <div className="brand-emblem-lockup">
                <BrandEmblem size={92} className="brand-emblem-svg" />
                <div className="brand-emblem-wordmark">
                  <strong>REALTY ANTA TERRA</strong>
                  <span>BIENES RAÍCES · ANTA, CUSCO</span>
                </div>
              </div>
              <p className="brand-emblem-caption">
                Significado del emblema oficial: selecciona cada trazo para
                explorar su arraigo territorial en el valle.
              </p>
            </div>

            <div
              className="emblem-part-tabs"
              role="tablist"
              aria-label="Elementos del logotipo de Realty Anta Terra"
            >
              {EMBLEM_PARTS.map((part) => (
                <button
                  key={part.id}
                  type="button"
                  role="tab"
                  aria-selected={activePartId === part.id}
                  className={`emblem-part-btn${
                    activePartId === part.id ? ' is-active' : ''
                  }`}
                  onClick={() => setActivePartId(part.id)}
                >
                  {part.label}
                </button>
              ))}
            </div>

            <div className="emblem-part-detail">
              <div className="emblem-detail-meta">
                <span>{activePart.role}</span>
              </div>
              <p className="emblem-detail-copy">{activePart.meaning}</p>
            </div>

            <div className="emblem-seal-footer tabular-nums">
              <span>Pampa de Anta · 3,345 m s.n.m.</span>
              <span aria-hidden="true">·</span>
              <span>Corredor Cusco – Chinchero</span>
            </div>
          </aside>
        </div>

        {/* Part 2: Editorial Principals / Agents Section */}
        <div className="advisors-block">
          <div className="advisors-header">
            <div>
              <span className="eyebrow-text">
                Dirección y curadores en territorio
              </span>
              <h2 className="section-title">
                Quiénes te acompañan en Anta.
              </h2>
            </div>
            <p className="advisors-header-sub">
              Un modelo de asesoría directa sin call centers: tratas desde la
              primera consulta con nuestros directores en campo y registro.
            </p>
          </div>

          <div className="advisors-grid">
            {ADVISORS.map((advisor) => {
              const isSelected = selectedAgent === advisor.name;
              return (
                <article key={advisor.name} className="advisor-card">
                  <div className="advisor-portrait-wrap">
                    <img
                      src={advisor.image}
                      alt={advisor.alt}
                      loading="lazy"
                      decoding="async"
                      referrerPolicy="no-referrer"
                      className="advisor-portrait-img"
                    />
                  </div>

                  <div className="advisor-body">
                    <div className="advisor-kicker">
                      <span>{advisor.role}</span>
                    </div>
                    <h3 className="advisor-name">{advisor.name}</h3>
                    <div className="advisor-meta-line">
                      <Compass size={14} strokeWidth={1.8} />
                      <span>{advisor.focus}</span>
                      <span aria-hidden="true">·</span>
                      <span>{advisor.territory}</span>
                    </div>

                    <p className="advisor-bio">{advisor.bio}</p>

                    <blockquote className="advisor-quote">
                      {advisor.ethos}
                    </blockquote>

                    <div className="advisor-actions">
                      <button
                        type="button"
                        className={`btn btn-sm ${
                          isSelected ? 'btn-primary' : 'btn-ghost'
                        }`}
                        onClick={() => onScheduleWithAgent(advisor.name)}
                      >
                        <CalendarCheck size={15} strokeWidth={1.9} />
                        <span>
                          {isSelected
                            ? `Recorrido con ${advisor.name} (en Dossier)`
                            : `Agendar recorrido con ${advisor.name}`}
                        </span>
                      </button>
                    </div>
                  </div>
                </article>
              );
            })}
          </div>
        </div>
      </div>
    </section>
  );
}
