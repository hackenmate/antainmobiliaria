import { useState } from 'react';
import { ChevronDown, FileCheck2 } from 'lucide-react';

interface FaqItem {
  id: string;
  question: string;
  answer: string;
}

const PROCESS_STEPS = [
  {
    num: '01.',
    title: 'Elección técnica y sobrevuelo',
    detail:
      'Revisas las ortofotos 4K, el mapa satelital en tiempo real y comparas las cotizaciones por m² según tu objetivo residencial o de inversión.',
  },
  {
    num: '02.',
    title: 'Recorrido presencial en Anta',
    detail:
      'Coordinas visita guiada con Alison Mariano o José Luis para verificar hitos físicos, orientación solar y accesos carrozables en campo.',
  },
  {
    num: '03.',
    title: 'Revisión registral SUNARP',
    detail:
      'Entregamos copia literal actualizada, plano perimétrico georreferenciado y certificado de búsqueda catastral previo a cualquier firma.',
  },
  {
    num: '04.',
    title: 'Escritura pública y entrega',
    detail:
      'Formalización ante notaría en Cusco, inscripción de transferencia a tu nombre y acompañamiento si optas por desarrollo de villa modular.',
  },
];

const FAQ_ITEMS: FaqItem[] = [
  {
    id: 'faq-sunarp',
    question: '¿Los terrenos cuentan con partida independiente en SUNARP?',
    answer:
      'Sí. Cada lote ofrecido en Izcuchaca, Zurite y Huarocondo pasa por verificación catastral y registral en Cusco para garantizar titularidad clara, linderos definidos y ausencia de superposiciones comunales o arqueológicas.',
  },
  {
    id: 'faq-servicios',
    question: '¿Qué factibilidad de servicios y acceso tienen las parcelas?',
    answer:
      'Todos los sectores cuentan con acceso por vía carrozable afirmada desde los corredores principales de Anta y cercanía inmediata a redes de energía eléctrica y conectividad. Durante la visita en campo verificamos cada punto técnico.',
  },
  {
    id: 'faq-financiamiento',
    question: '¿Es posible financiar la compra directamente sin trámite bancario?',
    answer:
      'Puedes utilizar nuestro simulador de cuota inicial y plazos (12, 24 o 36 meses) como referencia base y definir en tu Dossier el esquema de pago al contado o fraccionamiento directo durante la asesoría.',
  },
  {
    id: 'faq-villa',
    question: '¿En qué consiste la modalidad Terreno + Villa Modular?',
    answer:
      'Además de habilitar tu parcela, el equipo constructor de ALASO te ofrece la opción de ejecutar una vivienda modular de arquitectura andina contemporánea (piedra, madera y paños amplios de vidrio) adaptada a la pendiente real del terreno.',
  },
];

interface PurchaseFaqSectionProps {
  onOpenDossier: () => void;
}

export function PurchaseFaqSection({ onOpenDossier }: PurchaseFaqSectionProps) {
  const [openId, setOpenId] = useState<string>('faq-sunarp');

  return (
    <section id="proceso" className="faq-section">
      <div className="container faq-layout">
        <div className="faq-process-col">
          <div className="eyebrow-rule-row">
            <span className="eyebrow-text">Transparencia constructiva y legal</span>
            <span className="eyebrow-rule" aria-hidden="true" />
          </div>
          <h2 className="section-title">
            Tu compra en cuatro pasos claros.
          </h2>
          <p className="faq-intro">
            Desde el primer análisis topográfico hasta la inscripción notarial
            en Cusco, operamos con trazabilidad técnica y documental completa.
          </p>

          <div className="process-steps-list">
            {PROCESS_STEPS.map((step) => (
              <div key={step.num} className="process-step-row">
                <span className="process-step-num tabular-nums">{step.num}</span>
                <div>
                  <h3 className="process-step-title">{step.title}</h3>
                  <p className="process-step-detail">{step.detail}</p>
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="faq-accordion-col">
          <div className="faq-box">
            <div className="faq-box-head">
              <FileCheck2 size={18} strokeWidth={1.8} />
              <span>Preguntas frecuentes de compradores</span>
            </div>

            <div className="faq-list">
              {FAQ_ITEMS.map((item) => {
                const isOpen = openId === item.id;
                return (
                  <div
                    key={item.id}
                    className={`faq-item${isOpen ? ' is-open' : ''}`}
                  >
                    <button
                      type="button"
                      className="faq-trigger"
                      aria-expanded={isOpen}
                      onClick={() =>
                        setOpenId((prev) => (prev === item.id ? '' : item.id))
                      }
                    >
                      <span>{item.question}</span>
                      <ChevronDown
                        size={17}
                        strokeWidth={1.9}
                        className="faq-chevron"
                      />
                    </button>
                    {isOpen && <p className="faq-answer">{item.answer}</p>}
                  </div>
                );
              })}
            </div>

            <div className="faq-box-footer">
              <span>¿Necesitas revisar copia literal o plano de un sector?</span>
              <button
                type="button"
                className="faq-inline-cta"
                onClick={onOpenDossier}
              >
                Solicitar carpeta técnica
              </button>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
