import {
  ArrowRight,
  CalendarCheck,
  Compass,
  Gem,
  Handshake,
  Landmark,
  Mountain,
  ShieldCheck,
  Target,
} from 'lucide-react';
import type { AgentName } from '../data/properties';
import { AlasoLogo } from './AlasoLogo';
import alisonPortrait from '../assets/images/agent_alison_mariano_man_1795038930516.jpg';
import joseLuisPortrait from '../assets/images/agent_jose_luis_1795029238283.jpg';
import architecturalPavilion from '../assets/images/alaso_modern_pavilion_1795493777970.jpg';

interface BrandStorySectionProps {
  selectedAgent: AgentName;
  onScheduleWithAgent: (agent: AgentName) => void;
}

const BRAND_VALUES = [
  {
    id: 'confianza',
    label: 'Confianza',
    detail: 'Partidas SUNARP verificadas y transparencia documental.',
    Icon: ShieldCheck,
  },
  {
    id: 'solidez',
    label: 'Solidez',
    detail: 'Criterio constructivo y habilitación técnica con estándar de obra.',
    Icon: Landmark,
  },
  {
    id: 'modernidad',
    label: 'Modernidad',
    detail: 'Arquitectura contemporánea, drones 4K y levantamiento georreferenciado.',
    Icon: Gem,
  },
  {
    id: 'compromiso',
    label: 'Compromiso',
    detail: 'Acompañamiento directo de principio a fin sin intermediarios.',
    Icon: Handshake,
  },
] as const;

const BRAND_PILLARS = [
  {
    num: '01.',
    title: 'Curaduría Jurídica SUNARP',
    detail:
      'Cada propiedad atraviesa un estudio registral y catastral previo: partidas independientes inscritas en Cusco, linderos verificados y cero superposición arqueológica o comunal.',
  },
  {
    num: '02.',
    title: 'Diseño y Trabajar con la Pendiente',
    detail:
      'Trazamos lotizaciones orgánicas con frente a vía afirmada y drenaje natural, cuidando el asoleamiento andino y preservando las vistas limpias hacia los cerros de Anta.',
  },
  {
    num: '03.',
    title: 'Evidencia Audiovisual Real',
    detail:
      'Documentamos cada predio con vuelos en dron 4K y ortofotos de campo para que tomes decisiones sobre terreno real antes y durante tu visita presencial en Anta.',
  },
];

const PURPOSE_STATEMENTS = [
  {
    id: 'mision',
    eyebrow: 'Propósito en cada proyecto',
    title: 'Nuestra Misión',
    statement:
      'Desarrollar terrenos habilitados y proyectos arquitectónicos en la provincia de Anta con estricto respaldo registral SUNARP, criterio constructivo y respeto por la geografía andina; brindando asesoría directa, transparente y verificable en campo desde el primer recorrido hasta la entrega de tu propiedad.',
    anchors: ['Saneamiento verificable', 'Criterio constructivo', 'Trato directo en obra'],
    tone: 'marfil' as const,
    Icon: Target,
  },
  {
    id: 'vision',
    eyebrow: 'Horizonte en el valle',
    title: 'Nuestra Visión',
    statement:
      'Consolidar a ALASO como la constructora e inmobiliaria referente del corredor Cusco – Anta – Chinchero por dar vida a comunidades residenciales y casas quinta ordenadas, sostenibles y de sólida valorización patrimonial, integrando arquitectura contemporánea y paisaje agrícola en armonía.',
    anchors: ['Desarrollo orgánico', 'Valorización patrimonial', 'Identidad andina'],
    tone: 'granate' as const,
    Icon: Mountain,
  },
] as const;

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
    alt: 'Alison Mariano, socio director de ALASO Constructora e Inmobiliaria, sosteniendo planos topográficos frente a un pabellón de piedra y vidrio en Cusco',
  },
  {
    name: 'José Luis',
    role: 'Director de Campo · Topografía, Dron 4K y Desarrollo Territorial',
    focus: 'Fotogrametría Aérea · Factibilidad y Accesos',
    bio: 'Responsable del reconocimiento técnico en terreno, levantamientos topográficos georreferenciados y diseño de lotización orgánica. Guía las visitas presenciales mostrando linderos reales, orientación solar, accesibilidad vial y potencial constructivo de cada parcela.',
    ethos:
      '«Caminar el lote al atardecer revela lo que un plano oculta: por dónde corre el viento, dónde nace la vista y cómo emplazar la casa.»',
    territory: 'Laderas de Zurite · Mirador Huarocondo',
    image: joseLuisPortrait,
    alt: 'José Luis, director de campo de ALASO Constructora e Inmobiliaria, observando el valle andino con mapas topográficos en Anta, Cusco',
  },
];

export function BrandStorySection() {
  return (
    <section id="nosotros" className="sobre-alaso-section">
      <div className="container">
        {/* Part 1: Sobre ALASO Split Layout */}
        <div className="sobre-alaso-grid">
          <div className="sobre-visual-col">
            <div className="sobre-photo-frame">
              <img
                src={architecturalPavilion}
                alt="Residencia contemporánea de concreto, madera y cristal diseñada para el valle andino de Anta, Cusco"
                loading="lazy"
                decoding="async"
                referrerPolicy="no-referrer"
                className="sobre-photo-img"
              />
            </div>

            <div className="alaso-identity-panel">
              <div className="alaso-identity-crest">
                <AlasoLogo variant="dark-surface" height={96} />
              </div>
              <div className="alaso-values-grid">
                {BRAND_VALUES.map((val) => {
                  const IconComponent = val.Icon;
                  return (
                    <div key={val.id} className="alaso-value-item">
                      <IconComponent
                        size={18}
                        strokeWidth={1.7}
                        className="alaso-value-icon"
                      />
                      <div>
                        <strong className="alaso-value-label">{val.label}</strong>
                        <p className="alaso-value-detail">{val.detail}</p>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>

          <div className="sobre-editorial-col">
            <div className="eyebrow-rule-row">
              <span className="eyebrow-text">Sobre ALASO</span>
              <span className="eyebrow-rule" aria-hidden="true" />
            </div>

            <h2 className="section-title">
              Construimos confianza a través de cada proyecto.
            </h2>

            <p className="sobre-lead">
              ALASO — Constructora e Inmobiliaria desarrolla soluciones
              constructivas y habilitación de terrenos en la provincia de Anta,
              a 25 minutos del Cusco y sobre el corredor estratégico hacia
              Chinchero y el Valle Sagrado. Trabajamos con rigor técnico,
              respaldo legal verificable y visión arquitectónica de largo plazo.
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

            <div className="sobre-cta-row">
              <a href="#configurador" className="btn btn-primary">
                <span>Explorar sectores</span>
                <ArrowRight size={16} strokeWidth={2} />
              </a>
            </div>
          </div>
        </div>

        {/* Part 1.5: Organic Misión & Visión Architectural Diptych */}
        <div className="purpose-block" aria-labelledby="purpose-heading">
          <div className="purpose-header">
            <div>
              <div className="eyebrow-rule-row">
                <span className="eyebrow-text">Identidad y rumbo</span>
                <span className="eyebrow-rule" aria-hidden="true" />
              </div>
              <h2 id="purpose-heading" className="section-title">
                Arraigo territorial con visión de futuro.
              </h2>
            </div>
            <p className="purpose-header-sub">
              Cada hectárea que habilitamos nace de un equilibrio honesto entre
              seguridad jurídica, topografía natural y permanencia arquitectónica.
            </p>
          </div>

          <div className="purpose-grid">
            {PURPOSE_STATEMENTS.map((item) => {
              const IconComponent = item.Icon;
              return (
                <article
                  key={item.id}
                  className={`purpose-card purpose-card--${item.tone}`}
                >
                  <svg
                    className="purpose-contour-svg"
                    viewBox="0 0 240 240"
                    fill="none"
                    aria-hidden="true"
                  >
                    <path
                      d="M40 190C80 140 120 155 165 110C195 80 215 45 230 20"
                      stroke="currentColor"
                      strokeWidth="1.2"
                    />
                    <path
                      d="M15 220C70 175 130 185 180 138C210 110 228 75 240 50"
                      stroke="currentColor"
                      strokeWidth="1.2"
                    />
                    <path
                      d="M80 230C125 190 165 198 205 160C225 140 235 120 245 98"
                      stroke="currentColor"
                      strokeWidth="1.2"
                    />
                  </svg>

                  <div className="purpose-card-top">
                    <span className="purpose-icon-badge" aria-hidden="true">
                      <IconComponent size={20} strokeWidth={1.7} />
                    </span>
                    <span className="purpose-eyebrow">{item.eyebrow}</span>
                  </div>

                  <h3 className="purpose-title">{item.title}</h3>
                  <p className="purpose-text">{item.statement}</p>

                  <div className="purpose-anchors">
                    {item.anchors.map((anchor, idx) => (
                      <span key={anchor} className="purpose-anchor-item">
                        {idx > 0 && (
                          <span className="purpose-anchor-sep" aria-hidden="true">
                            ·
                          </span>
                        )}
                        <span>{anchor}</span>
                      </span>
                    ))}
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

export function AdvisorsSection({
  selectedAgent,
  onScheduleWithAgent,
}: BrandStorySectionProps) {
  return (
    <section id="equipo" className="advisors-section">
      <div className="container">
        <div className="advisors-header">
          <div>
            <div className="eyebrow-rule-row">
              <span className="eyebrow-text">
                Dirección y curadores en territorio
              </span>
              <span className="eyebrow-rule" aria-hidden="true" />
            </div>
            <h2 className="section-title">Quiénes te acompañan en Anta.</h2>
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
                        isSelected ? 'btn-primary' : 'btn-outline'
                      }`}
                      onClick={() => onScheduleWithAgent(advisor.name)}
                    >
                      <CalendarCheck size={15} strokeWidth={1.9} />
                      <span>
                        {isSelected
                          ? `Recorrido con ${advisor.name} (en Dossier)`
                          : `Agendar recorrido con ${advisor.name}`}
                      </span>
                      <ArrowRight size={14} strokeWidth={2} />
                    </button>
                  </div>
                </div>
              </article>
            );
          })}
        </div>
      </div>
    </section>
  );
}
