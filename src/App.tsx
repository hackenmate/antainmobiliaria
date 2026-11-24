import { useCallback, useEffect, useMemo, useRef, useState, type FormEvent } from 'react';
import gsap from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import Lenis from 'lenis';
import {
  addDoc,
  collection,
  onSnapshot,
  orderBy,
  query,
  serverTimestamp,
  where,
} from 'firebase/firestore';
import { onAuthStateChanged, signInWithPopup, type User } from 'firebase/auth';
import {
  ArrowRight,
  ArrowUpRight,
  Calendar,
  Check,
  DraftingCompass,
  Film,
  Handshake,
  HardHat,
  Home,
  Moon,
  Sun,
  X,
} from 'lucide-react';
import { initHeroCanvas } from './webgl/heroCanvas';
import { initSpecsCanvas } from './webgl/specsCanvas';
import {
  AREA_OPTIONS,
  DEFAULT_SHOWCASE_SLIDES,
  REAL_ASSETS,
  SECTORS,
  VILLA_BUILD_SURCHARGE_USD,
  type AgentName,
  type ModalityId,
  type SectorId,
  type ShowcaseSlide,
} from './data/properties';
import { AntaInteractiveMap } from './components/AntaInteractiveMap';
import { AlasoLogo } from './components/AlasoLogo';
import { BrandStorySection } from './components/BrandStorySection';
import { TestimonialsSection } from './components/TestimonialsSection';
import {
  MediaStudioSection,
  type MediaAssetRecord,
} from './components/MediaStudioSection';
import {
  OperationType,
  auth,
  db,
  googleProvider,
  handleFirestoreError,
  popupRedirectResolver,
} from './firebase';
import architecturalPavilion from './assets/images/alaso_modern_pavilion_1795493777970.jpg';
import andeanVillaPreview from './assets/images/alaso_andean_villa_1795493779769.jpg';

gsap.registerPlugin(ScrollTrigger);

interface DossierItem {
  id: string;
  sector: SectorId;
  areaSqm: number;
  modality: ModalityId;
  estimatedUsd: number;
}

interface SavedInquiryRecord {
  id: string;
  sector: SectorId;
  areaSqm: number;
  modality: ModalityId;
  estimatedUsd: number;
  visitDate: string;
  status: string;
}

const TRUST_PILLARS = [
  {
    title: 'Construcción de calidad',
    subtitle: 'Habilitación técnica en obra',
    Icon: HardHat,
  },
  {
    title: 'Desarrollo inmobiliario',
    subtitle: 'Sectores en el valle de Anta',
    Icon: Home,
  },
  {
    title: 'Diseño y planificación',
    subtitle: 'Topografía y ortofotos 4K',
    Icon: DraftingCompass,
  },
  {
    title: 'Asesoría personalizada',
    subtitle: 'Saneamiento SUNARP directo',
    Icon: Handshake,
  },
] as const;

function formatUsd(amount: number): string {
  return new Intl.NumberFormat('es-PE', {
    style: 'currency',
    currency: 'USD',
    maximumFractionDigits: 0,
  }).format(amount);
}

export default function App() {
  // Always open in light Marfil theme matching the ALASO reference specification
  const [theme, setTheme] = useState<'dark' | 'light'>('light');
  const [quotaExceeded, setQuotaExceeded] = useState(false);

  // Active configuration state
  const [sector, setSector] = useState<SectorId>('izcuchaca');
  const [areaSqm, setAreaSqm] = useState<number>(600);
  const [modality, setModality] = useState<ModalityId>('terreno');

  // Showcase & Comparison state
  const [customShowcase, setCustomShowcase] = useState<MediaAssetRecord[]>([]);
  const [activeStage, setActiveStage] = useState<number>(0);
  const [showcaseInView, setShowcaseInView] = useState<boolean>(false);
  const [captionBlur, setCaptionBlur] = useState<boolean>(false);
  const [splitPct, setSplitPct] = useState<number>(50);
  const [splitAnimate, setSplitAnimate] = useState<boolean>(false);

  // Auth, Dossier & Firestore Inquiries
  const [user, setUser] = useState<User | null>(null);
  const [authReady, setAuthReady] = useState<boolean>(false);
  const [dossier, setDossier] = useState<DossierItem[]>([]);
  const [drawerOpen, setDrawerOpen] = useState<boolean>(false);
  const [clientName, setClientName] = useState<string>('');
  const [clientPhone, setClientPhone] = useState<string>('');
  const [visitDate, setVisitDate] = useState<string>('2026-11-28');
  const [selectedAgent, setSelectedAgent] = useState<AgentName>('Alison Mariano');
  const [notes, setNotes] = useState<string>('');
  const [submittingInquiry, setSubmittingInquiry] = useState<boolean>(false);
  const [inquirySuccess, setInquirySuccess] = useState<string | null>(null);
  const [inquiryError, setInquiryError] = useState<string | null>(null);
  const [myInquiries, setMyInquiries] = useState<SavedInquiryRecord[]>([]);

  // Refs for WebGL, GSAP & Pointer physics
  const heroCanvasRef = useRef<HTMLCanvasElement | null>(null);
  const specsCanvasRef = useRef<HTMLCanvasElement | null>(null);
  const heroStageRef = useRef<HTMLDivElement | null>(null);
  const tiltWrapRef = useRef<HTMLDivElement | null>(null);
  const shadowRef = useRef<HTMLDivElement | null>(null);
  const showcaseRef = useRef<HTMLElement | null>(null);
  const frameRefs = useRef<(HTMLElement | null)[]>([]);
  const bentoGridRef = useRef<HTMLDivElement | null>(null);
  const compWrapRef = useRef<HTMLDivElement | null>(null);
  const isDraggingRef = useRef<boolean>(false);
  const stageIdxRef = useRef<number>(0);
  const stageTimerRef = useRef<number | null>(null);

  const showcaseSlides: ShowcaseSlide[] = useMemo(() => {
    if (customShowcase.length === 0) return DEFAULT_SHOWCASE_SLIDES;
    const mapped: ShowcaseSlide[] = customShowcase.slice(0, 4).map((m) => ({
      id: m.id,
      mediaType: m.mediaType,
      url: m.url,
      poster: m.poster,
      alt: m.title,
      title: m.title,
      subtitle: m.subtitle || 'ALASO Constructora e Inmobiliaria · Anta, Cusco',
      sector: m.sector,
    }));
    while (mapped.length < 4) {
      mapped.push(DEFAULT_SHOWCASE_SLIDES[mapped.length]);
    }
    return mapped;
  }, [customShowcase]);

  const handleShowcaseAssetsChange = useCallback(
    (assets: MediaAssetRecord[]) => {
      setCustomShowcase(assets);
    },
    []
  );

  // Quota exceeded listener
  useEffect(() => {
    const onQuota = () => setQuotaExceeded(true);
    window.addEventListener('gmp-quota-exceeded', onQuota);
    return () => window.removeEventListener('gmp-quota-exceeded', onQuota);
  }, []);

  // Defer giant drone MP4 streaming until #showcase approaches viewport
  useEffect(() => {
    const el = showcaseRef.current;
    if (!el || typeof IntersectionObserver === 'undefined') {
      setShowcaseInView(true);
      return;
    }
    const observer = new IntersectionObserver(
      (entries) => {
        if (entries.some((entry) => entry.isIntersecting)) {
          setShowcaseInView(true);
        }
      },
      { rootMargin: '320px 0px' }
    );
    observer.observe(el);
    return () => observer.disconnect();
  }, []);

  // Theme sync
  useEffect(() => {
    document.documentElement.setAttribute('data-theme', theme);
  }, [theme]);

  // Firebase Auth listener
  useEffect(() => {
    const unsub = onAuthStateChanged(auth, (nextUser) => {
      setUser(nextUser);
      setAuthReady(true);
      if (nextUser?.displayName) {
        setClientName((prev) => prev || nextUser.displayName || '');
      }
    });
    return () => unsub();
  }, []);

  // Load user's own inquiries from Firestore when signed in
  useEffect(() => {
    if (!authReady || !user?.emailVerified) {
      setMyInquiries([]);
      return;
    }

    const q = query(
      collection(db, 'inquiries'),
      where('userId', '==', user.uid),
      orderBy('createdAt', 'desc')
    );

    const unsub = onSnapshot(
      q,
      (snap) => {
        const list: SavedInquiryRecord[] = snap.docs.map((d) => {
          const data = d.data();
          return {
            id: d.id,
            sector: (data.sector as SectorId) || 'izcuchaca',
            areaSqm: Number(data.areaSqm ?? 600),
            modality: (data.modality as ModalityId) || 'terreno',
            estimatedUsd: Number(data.estimatedUsd ?? 0),
            visitDate: String(data.visitDate || ''),
            status: String(data.status || 'pending'),
          };
        });
        setMyInquiries(list);
      },
      (err) => {
        handleFirestoreError(err, OperationType.LIST, 'inquiries');
      }
    );

    return () => unsub();
  }, [authReady, user]);

  // WebGL, Lenis, Hero 3D Pointer Tilt & GSAP ScrollTrigger Showcase
  useEffect(() => {
    const prefersReduced = window.matchMedia(
      '(prefers-reduced-motion: reduce)'
    ).matches;

    const cleanupHeroGl = initHeroCanvas(heroCanvasRef.current);
    const cleanupSpecsGl = initSpecsCanvas(specsCanvasRef.current);

    let lenis: InstanceType<typeof Lenis> | null = null;
    let lenisTicker: ((time: number) => void) | null = null;
    if (!prefersReduced) {
      lenis = new Lenis({
        duration: 1.05,
        easing: (t: number) => Math.min(1, 1.001 - Math.pow(2, -10 * t)),
        smoothWheel: true,
      });
      lenis.on('scroll', ScrollTrigger.update);
      lenisTicker = (time: number) => {
        lenis?.raf(time * 1000);
      };
      gsap.ticker.add(lenisTicker);
      gsap.ticker.lagSmoothing(0);
    }

    let targetRotX = 0;
    let targetRotY = 0;
    let curRotX = 0;
    let curRotY = 0;
    let velX = 0;
    let velY = 0;
    let tiltTicker: (() => void) | null = null;

    const heroStage = heroStageRef.current;
    const onHeroMove = (e: PointerEvent) => {
      if (!heroStage) return;
      const rect = heroStage.getBoundingClientRect();
      const nx = ((e.clientX - rect.left) / rect.width - 0.5) * 2;
      const ny = ((e.clientY - rect.top) / rect.height - 0.5) * 2;
      targetRotY = nx * 9;
      targetRotX = -ny * 7;
    };
    const onHeroLeave = () => {
      targetRotX = 0;
      targetRotY = 0;
    };

    if (heroStage && tiltWrapRef.current && !prefersReduced) {
      heroStage.addEventListener('pointermove', onHeroMove);
      heroStage.addEventListener('pointerleave', onHeroLeave);
      tiltTicker = () => {
        const ax = (targetRotX - curRotX) * 0.08;
        const ay = (targetRotY - curRotY) * 0.08;
        velX = (velX + ax) * 0.82;
        velY = (velY + ay) * 0.82;
        curRotX += velX;
        curRotY += velY;
        if (tiltWrapRef.current) {
          tiltWrapRef.current.style.transform = `rotateX(${curRotX.toFixed(2)}deg) rotateY(${curRotY.toFixed(2)}deg)`;
        }
        if (shadowRef.current) {
          shadowRef.current.style.transform = `translateX(${(-curRotY * 1.4).toFixed(1)}px) scale(${1 - Math.abs(curRotX) * 0.01})`;
        }
      };
      gsap.ticker.add(tiltTicker);
    }

    const gsapCtx = gsap.context(() => {
      if (prefersReduced) return;

      const frames = frameRefs.current.filter(
        (el): el is HTMLElement => el !== null
      );
      if (showcaseRef.current && frames.length === 4) {
        const tl = gsap.timeline({
          scrollTrigger: {
            trigger: showcaseRef.current,
            start: 'top top',
            end: '+=280%',
            pin: true,
            scrub: 0.65,
            onUpdate: (self: { progress: number }) => {
              const t = self.progress * 3.5;
              let nextIdx = 0;
              if (t >= 3.07) nextIdx = 3;
              else if (t >= 2.02) nextIdx = 2;
              else if (t >= 0.97) nextIdx = 1;

              if (nextIdx !== stageIdxRef.current) {
                stageIdxRef.current = nextIdx;
                setCaptionBlur(true);
                if (stageTimerRef.current !== null) {
                  window.clearTimeout(stageTimerRef.current);
                }
                stageTimerRef.current = window.setTimeout(() => {
                  stageTimerRef.current = null;
                  setActiveStage(nextIdx);
                  setCaptionBlur(false);
                }, 100);
              }
            },
          },
        });

        const wipeStarts = [0.25, 1.3, 2.35];
        frames.forEach((frame, i) => {
          if (i === 0) return;
          tl.fromTo(
            frame,
            { clipPath: 'inset(0 0 0 100%)' },
            { clipPath: 'inset(0 0 0 0%)', ease: 'none', duration: 0.8 },
            wipeStarts[i - 1]
          );
        });
        tl.set({}, {}, 3.5);
      }

      if (bentoGridRef.current) {
        gsap.from('.reveal-tile', {
          y: 28,
          scale: 0.96,
          opacity: 0,
          duration: 0.65,
          stagger: 0.08,
          ease: 'power3.out',
          clearProps: 'transform,opacity',
          scrollTrigger: {
            trigger: bentoGridRef.current,
            start: 'top 82%',
            once: true,
          },
        });
      }
    });

    return () => {
      if (stageTimerRef.current !== null) {
        window.clearTimeout(stageTimerRef.current);
        stageTimerRef.current = null;
      }
      cleanupHeroGl();
      cleanupSpecsGl();
      gsapCtx.revert();
      if (tiltTicker) gsap.ticker.remove(tiltTicker);
      if (lenisTicker) gsap.ticker.remove(lenisTicker);
      lenis?.destroy();
      heroStage?.removeEventListener('pointermove', onHeroMove);
      heroStage?.removeEventListener('pointerleave', onHeroLeave);
    };
  }, []);

  useEffect(() => {
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && drawerOpen) {
        setDrawerOpen(false);
      }
    };
    document.addEventListener('keydown', onKeyDown);
    return () => document.removeEventListener('keydown', onKeyDown);
  }, [drawerOpen]);

  const selectStage = (idx: number) => {
    stageIdxRef.current = idx;
    setCaptionBlur(true);
    if (stageTimerRef.current !== null) {
      window.clearTimeout(stageTimerRef.current);
    }
    stageTimerRef.current = window.setTimeout(() => {
      stageTimerRef.current = null;
      setActiveStage(idx);
      setCaptionBlur(false);
    }, 110);
    frameRefs.current.forEach((frame, i) => {
      if (!frame) return;
      frame.style.clipPath =
        i <= idx ? 'inset(0 0 0 0%)' : 'inset(0 0 0 100%)';
    });
  };

  const updateSplit = (pct: number, animate: boolean) => {
    const clamped = Math.max(0, Math.min(100, pct));
    setSplitAnimate(animate);
    setSplitPct(clamped);
  };

  const handleCompPointerDown = (e: {
    currentTarget: HTMLDivElement;
    pointerId: number;
    clientX: number;
  }) => {
    isDraggingRef.current = true;
    e.currentTarget.setPointerCapture(e.pointerId);
    const rect = e.currentTarget.getBoundingClientRect();
    updateSplit(((e.clientX - rect.left) / rect.width) * 100, false);
  };

  const handleCompPointerMove = (e: {
    currentTarget: HTMLDivElement;
    clientX: number;
  }) => {
    if (!isDraggingRef.current) return;
    const rect = e.currentTarget.getBoundingClientRect();
    updateSplit(((e.clientX - rect.left) / rect.width) * 100, false);
  };

  const handleCompPointerUp = () => {
    isDraggingRef.current = false;
  };

  const activeSectorInfo = SECTORS[sector];
  const estimatedUsd =
    areaSqm * activeSectorInfo.pricePerSqmUsd +
    (modality === 'villa' ? VILLA_BUILD_SURCHARGE_USD : 0);

  const activeScale =
    AREA_OPTIONS.find((a) => a.sqm === areaSqm)?.scale ?? 1.0;

  const configuratorImage =
    modality === 'villa' ? andeanVillaPreview : activeSectorInfo.image;
  const configuratorAlt =
    modality === 'villa'
      ? `Propuesta arquitectónica de villa modular en piedra y madera para ${activeSectorInfo.name}`
      : activeSectorInfo.alt;

  const addCurrentToDossier = () => {
    const itemId = `${sector}-${areaSqm}-${modality}`;
    setInquirySuccess(null);
    setDossier((prev) => {
      if (prev.some((p) => p.id === itemId)) return prev;
      return [
        ...prev,
        {
          id: itemId,
          sector,
          areaSqm,
          modality,
          estimatedUsd,
        },
      ];
    });
    setDrawerOpen(true);
  };

  const removeFromDossier = (id: string) => {
    setDossier((prev) => prev.filter((item) => item.id !== id));
  };

  const handleSubmitInquiry = async (e: FormEvent) => {
    e.preventDefault();
    setInquiryError(null);
    setInquirySuccess(null);

    const trimmedName = clientName.trim();
    const trimmedPhone = clientPhone.trim();
    if (trimmedName.length < 2 || trimmedPhone.length < 6) {
      setInquiryError('Ingresa tu nombre completo y teléfono de contacto.');
      return;
    }

    setSubmittingInquiry(true);
    try {
      let currentUser = auth.currentUser;
      if (!currentUser) {
        const cred = await signInWithPopup(
          auth,
          googleProvider,
          popupRedirectResolver
        );
        currentUser = cred.user;
      }
      if (!currentUser.emailVerified || !currentUser.email) {
        setInquiryError(
          'Tu cuenta Google debe tener correo verificado para registrar la visita.'
        );
        setSubmittingInquiry(false);
        return;
      }

      const targetItem = dossier[0] || {
        sector,
        areaSqm,
        modality,
        estimatedUsd,
      };

      const formattedNotes = `[Asesor: ${selectedAgent}]${
        notes.trim() ? ` ${notes.trim()}` : ''
      }`.slice(0, 800);

      await addDoc(collection(db, 'inquiries'), {
        userId: currentUser.uid,
        clientName: trimmedName.slice(0, 120),
        clientEmail: currentUser.email.slice(0, 160),
        clientPhone: trimmedPhone.slice(0, 40),
        sector: targetItem.sector,
        areaSqm: targetItem.areaSqm,
        modality: targetItem.modality,
        estimatedUsd: targetItem.estimatedUsd,
        visitDate: visitDate.slice(0, 40),
        notes: formattedNotes,
        status: 'pending',
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
      });

      setDossier([]);
      setNotes('');
      setInquirySuccess(
        `Solicitud registrada. ${selectedAgent} de ALASO confirmará tu recorrido en Anta.`
      );
    } catch (err: unknown) {
      if (
        err instanceof Error &&
        err.message.includes('Missing or insufficient permissions')
      ) {
        handleFirestoreError(err, OperationType.CREATE, 'inquiries');
      }
      setInquiryError(
        err instanceof Error
          ? err.message
          : 'No se pudo enviar la solicitud. Intenta nuevamente.'
      );
    } finally {
      setSubmittingInquiry(false);
    }
  };

  const handleConfigureFromMap = (sid: SectorId) => {
    setSector(sid);
    document
      .getElementById('configurador')
      ?.scrollIntoView({ behavior: 'smooth' });
  };

  const handleScheduleWithAgent = (agent: AgentName) => {
    setSelectedAgent(agent);
    setInquirySuccess(null);
    setDrawerOpen(true);
  };

  const handleConfigureParcel = (nextSector: SectorId, nextArea: number) => {
    setSector(nextSector);
    setAreaSqm(nextArea);
    document
      .getElementById('configurador')
      ?.scrollIntoView({ behavior: 'smooth' });
  };

  const dossierCount = dossier.length + myInquiries.length;

  return (
    <>
      {quotaExceeded && (
        <div className="gmp-quota-banner">
          <span>
            Google Maps Platform quota reached. If you are the app owner, visit{' '}
            <a
              href="https://developers.google.com/maps/ai/ai-studio?utm_campaign=gmp_mcp_codeassist_v1_aistudio#quota_exceeded_errors"
              target="_blank"
              rel="noopener noreferrer"
              className="gmp-quota-link"
            >
              maps developer site
            </a>{' '}
            for instructions to update your account.
          </span>
        </div>
      )}

      {/* Top Bar Contract: Strictly 3 Zones [ALASO Brand] — [5 links] — [1 primary CTA] */}
      <header className="site-header" id="site-header">
        <div className="container header-inner">
          <a
            href="#hero"
            className="brand-lockup"
            aria-label="ALASO Constructora e Inmobiliaria Inicio"
          >
            <AlasoLogo variant="light-surface" />
          </a>

          <nav className="header-nav" aria-label="Navegación principal">
            <a href="#showcase" className="nav-link">
              Sobrevuelos
            </a>
            <a href="#mapa" className="nav-link">
              Mapa
            </a>
            <a href="#nosotros" className="nav-link">
              Nosotros
            </a>
            <a href="#configurador" className="nav-link">
              Terrenos
            </a>
            <a href="#estudio" className="nav-link">
              Estudio
            </a>
          </nav>

          <div className="header-cta-zone">
            <button
              type="button"
              className="btn btn-primary btn-sm"
              onClick={() => setDrawerOpen(true)}
            >
              <span>Solicitar Asesoría</span>
              {dossierCount > 0 ? (
                <span className="header-count tabular-nums">({dossierCount})</span>
              ) : (
                <ArrowRight size={15} strokeWidth={2} />
              )}
            </button>
          </div>
        </div>
      </header>

      <main>
        {/* SECTION 1: Architectural Dusk Hero */}
        <section id="hero" className="hero">
          <canvas
            ref={heroCanvasRef}
            id="hero-gl-canvas"
            className="hero-canvas"
            aria-hidden="true"
          />

          <div className="container hero-grid">
            <div className="hero-copy">
              <div className="hero-kicker-row">
                <div className="eyebrow-rule-row">
                  <span className="eyebrow-text hero-eyebrow">
                    Constructora e Inmobiliaria · Anta, Cusco
                  </span>
                  <span className="eyebrow-rule" aria-hidden="true" />
                </div>
                <button
                  type="button"
                  className="theme-inline-btn"
                  aria-label="Cambiar modo claro u oscuro"
                  onClick={() =>
                    setTheme(theme === 'light' ? 'dark' : 'light')
                  }
                >
                  {theme === 'light' ? (
                    <Moon size={15} strokeWidth={1.8} />
                  ) : (
                    <Sun size={15} strokeWidth={1.8} />
                  )}
                  <span>{theme === 'light' ? 'Oscuro' : 'Claro'}</span>
                </button>
              </div>

              <h1 className="hero-title">
                Construimos espacios. Creamos oportunidades.
              </h1>
              <p className="hero-sub">
                En ALASO desarrollamos terrenos habilitados con criterio
                constructivo, documentación en regla en SUNARP y registro real
                en dron 4K en la provincia de Anta, corredor Cusco – Chinchero.
              </p>

              <div className="hero-actions">
                <a href="#configurador" className="btn btn-primary">
                  <span>Cotizar Terreno</span>
                  <ArrowRight size={16} strokeWidth={2} />
                </a>
                <a href="#estudio" className="btn btn-hero-outline">
                  <Film size={16} strokeWidth={1.9} />
                  <span>Ver Videos Dron</span>
                </a>
                <a href="#mapa" className="btn btn-hero-outline">
                  <span>Mapa en Vivo</span>
                  <ArrowUpRight size={16} strokeWidth={1.9} />
                </a>
              </div>
            </div>

            <div className="hero-stage" ref={heroStageRef} id="hero-stage">
              <div
                className="hero-frame-tilt"
                ref={tiltWrapRef}
                id="hero-tilt-wrap"
              >
                <div className="hero-visual-card">
                  <img
                    src={activeSectorInfo.image}
                    alt={activeSectorInfo.alt}
                    referrerPolicy="no-referrer"
                    className="hero-estate-img"
                  />
                  <div className="hero-visual-scrim">
                    <div className="hero-visual-meta">
                      <span>{activeSectorInfo.district}</span>
                      <span aria-hidden="true">·</span>
                      <span className="tabular-nums">
                        {activeSectorInfo.elevation}
                      </span>
                    </div>
                    <div className="hero-visual-bottom">
                      <span className="hero-visual-title">
                        {activeSectorInfo.name}
                      </span>
                      <span className="hero-visual-price tabular-nums">
                        USD {activeSectorInfo.pricePerSqmUsd}/m²
                      </span>
                    </div>
                  </div>
                </div>
              </div>
              <div
                className="estate-shadow"
                ref={shadowRef}
                aria-hidden="true"
              />

              <div
                className="hero-swatches"
                role="radiogroup"
                aria-label="Seleccionar sector en Anta"
              >
                {(Object.keys(SECTORS) as SectorId[]).map((key) => {
                  const meta = SECTORS[key];
                  const isActive = sector === key;
                  return (
                    <button
                      key={key}
                      type="button"
                      role="radio"
                      className={`swatch-btn${isActive ? ' is-active' : ''}`}
                      aria-checked={isActive}
                      onClick={() => setSector(key)}
                    >
                      <span
                        className="swatch-dot"
                        style={{ background: meta.dotColor }}
                      />
                      <span className="swatch-label">{meta.shortName}</span>
                    </button>
                  );
                })}
              </div>
            </div>
          </div>
        </section>

        {/* Architectural 4-Pillar Trust Strip below Hero */}
        <section className="hero-trust-strip" aria-label="Pilares ALASO">
          <div className="container trust-strip-grid">
            {TRUST_PILLARS.map((item) => {
              const IconComponent = item.Icon;
              return (
                <div key={item.title} className="trust-pillar-cell">
                  <span className="trust-pillar-icon" aria-hidden="true">
                    <IconComponent size={20} strokeWidth={1.7} />
                  </span>
                  <div className="trust-pillar-copy">
                    <strong className="trust-pillar-title">{item.title}</strong>
                    <span className="trust-pillar-sub">{item.subtitle}</span>
                  </div>
                </div>
              );
            })}
          </div>
        </section>

        {/* SECTION 2: Pinned 4-Angle Drone Video & Aerial Photography Showcase */}
        <section id="showcase" ref={showcaseRef} className="showcase-pin">
          <div className="showcase-viewport" id="showcase-viewport">
            <div className="showcase-frames" id="showcase-frames">
              {showcaseSlides.map((slide, i) => (
                <figure
                  key={`${slide.id}-${i}`}
                  ref={(el: HTMLElement | null) => {
                    frameRefs.current[i] = el;
                  }}
                  className={`showcase-frame${i === 0 ? ' is-active' : ''}`}
                  data-index={i}
                >
                  {slide.mediaType === 'video' ? (
                    showcaseInView && activeStage === i ? (
                      <video
                        src={slide.url}
                        poster={slide.poster}
                        autoPlay
                        muted
                        loop
                        playsInline
                        preload="metadata"
                        className="showcase-img"
                      />
                    ) : (
                      <img
                        src={slide.poster || REAL_ASSETS.orthoFullBlock}
                        alt={slide.alt}
                        loading={i === 0 ? 'eager' : 'lazy'}
                        decoding="async"
                        referrerPolicy="no-referrer"
                        className="showcase-img"
                      />
                    )
                  ) : (
                    <img
                      src={slide.url}
                      alt={slide.alt}
                      loading={i === 0 ? 'eager' : 'lazy'}
                      decoding="async"
                      referrerPolicy="no-referrer"
                      className="showcase-img"
                    />
                  )}
                </figure>
              ))}
            </div>

            <div className="showcase-hud">
              <div
                className={`showcase-caption${captionBlur ? ' is-blurring' : ''}`}
                id="showcase-caption"
              >
                <span className="showcase-type-kicker">
                  {showcaseSlides[activeStage]?.mediaType === 'video'
                    ? 'Video aéreo en tiempo real · Dron DJI'
                    : 'Fotografía aérea de alta resolución'}
                </span>
                <h2 className="caption-title" id="caption-title">
                  {showcaseSlides[activeStage]?.title}
                </h2>
                <p className="caption-sub" id="caption-sub">
                  {showcaseSlides[activeStage]?.subtitle}
                </p>
              </div>

              <div
                className="showcase-dots"
                role="tablist"
                aria-label="Perspectivas ALASO en Anta"
              >
                {showcaseSlides.map((slide, i) => (
                  <button
                    key={`${slide.id}-dot-${i}`}
                    type="button"
                    role="tab"
                    aria-selected={activeStage === i}
                    className={`stage-dot${activeStage === i ? ' is-active' : ''}`}
                    aria-label={`Vista ${i + 1}: ${slide.title}`}
                    onClick={() => selectStage(i)}
                  />
                ))}
              </div>
            </div>
          </div>
        </section>

        {/* SECTION 3: Interactive Orthophoto Survey Comparison Slider */}
        <section id="desarrollo" className="thermal-section">
          <div className="container thermal-grid">
            <div
              className="comparison-wrap"
              ref={compWrapRef}
              id="comparison-wrap"
              onPointerDown={handleCompPointerDown}
              onPointerMove={handleCompPointerMove}
              onPointerUp={handleCompPointerUp}
              onPointerCancel={handleCompPointerUp}
            >
              <div className="comparison-layer comparison-hot">
                <img
                  src={REAL_ASSETS.orthoTerraceClose}
                  alt="Detalle cenital de parcelas planas, linderos definidos y arboleda de eucaliptos en Anta"
                  loading="lazy"
                  decoding="async"
                  referrerPolicy="no-referrer"
                  className="comparison-img"
                />
                <span className="comparison-tag comparison-tag-right">
                  Detalle de Parcelas
                </span>
              </div>

              <div
                className="comparison-layer comparison-cold"
                id="comparison-cold"
                style={{
                  clipPath: `inset(0 ${100 - splitPct}% 0 0)`,
                  transition: splitAnimate
                    ? 'clip-path 380ms var(--ease-out)'
                    : 'none',
                }}
              >
                <img
                  src={REAL_ASSETS.orthoFullBlock}
                  alt="Ortofoto general del polígono completo en Anta mostrando acceso vial y entorno agrícola"
                  loading="lazy"
                  decoding="async"
                  referrerPolicy="no-referrer"
                  className="comparison-img"
                />
                <span className="comparison-tag comparison-tag-left">
                  Polígono Matriz
                </span>
              </div>

              <div
                className={`comparison-handle${
                  splitPct <= 2 || splitPct >= 98 ? ' is-edge' : ''
                }`}
                id="comparison-handle"
                role="slider"
                tabIndex={0}
                aria-label="Comparar vista general del polígono y detalle de parcelas"
                aria-valuemin={0}
                aria-valuemax={100}
                aria-valuenow={Math.round(splitPct)}
                style={{
                  left: `clamp(22px, ${splitPct}%, calc(100% - 22px))`,
                  transition: splitAnimate
                    ? 'left 380ms var(--ease-out)'
                    : 'none',
                }}
                onKeyDown={(e) => {
                  if (e.key === 'ArrowLeft') updateSplit(splitPct - 8, true);
                  if (e.key === 'ArrowRight') updateSplit(splitPct + 8, true);
                }}
              >
                <div className="handle-line" />
                <div className="handle-knob" aria-hidden="true">
                  ↔
                </div>
              </div>
            </div>

            <div className="thermal-copy">
              <div className="eyebrow-rule-row">
                <span className="eyebrow-text">
                  Levantamiento fotogramétrico real · Octubre 2026
                </span>
                <span className="eyebrow-rule" aria-hidden="true" />
              </div>
              <h2 className="section-title">
                Del polígono matriz al trazo exacto de tu lote.
              </h2>
              <p className="section-sub">
                Desliza para comparar la vista panorámica del corredor vial con
                el acercamiento cenital a los paños habilitables, rodeados de
                cortinas de eucaliptos y chacras productivas.
              </p>

              <div
                className="segmented-control"
                role="tablist"
                aria-label="Comparativa de ortofotos"
              >
                <button
                  type="button"
                  role="tab"
                  className={`seg-btn${splitPct >= 98 ? ' is-active' : ''}`}
                  aria-selected={splitPct >= 98}
                  onClick={() => updateSplit(100, true)}
                >
                  Polígono Matriz
                </button>
                <button
                  type="button"
                  role="tab"
                  className={`seg-btn${splitPct <= 2 ? ' is-active' : ''}`}
                  aria-selected={splitPct <= 2}
                  onClick={() => updateSplit(0, true)}
                >
                  Detalle Parcelas
                </button>
              </div>

              <div className="thermal-metrics">
                <div className="metric-item">
                  <span className="metric-value tabular-nums">3,345 m</span>
                  <span className="metric-label">Altitud del valle</span>
                </div>
                <div className="metric-item">
                  <span className="metric-value tabular-nums">100%</span>
                  <span className="metric-label">Partida SUNARP</span>
                </div>
                <div className="metric-item">
                  <span className="metric-value tabular-nums">25 min</span>
                  <span className="metric-label">Desde Cusco</span>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* SECTION 4: Real-Time Google Maps Platform Explorer */}
        <AntaInteractiveMap
          activeSector={sector}
          onSelectSector={setSector}
          onConfigureSector={handleConfigureFromMap}
        />

        {/* SECTION 5: Asymmetric 3-Tile Architectural Bento */}
        <section id="especificaciones" className="bento-section">
          <div className="container">
            <div className="section-header-stack">
              <div className="eyebrow-rule-row">
                <span className="eyebrow-text">
                  Presencia en campo, arquitectura y topografía
                </span>
                <span className="eyebrow-rule" aria-hidden="true" />
              </div>
              <h2 className="section-title">
                Arraigo en Anta con estándar constructivo.
              </h2>
            </div>

            <div className="bento-grid" ref={bentoGridRef}>
              <article className="bento-tile bento-tall reveal-tile">
                <img
                  src={REAL_ASSETS.chapelTeamWide}
                  alt="Capilla andina de doble torre frente a la ladera forestada con el equipo de ALASO en visita técnica"
                  loading="lazy"
                  decoding="async"
                  referrerPolicy="no-referrer"
                  className="bento-img"
                />
                <div className="bento-footer">
                  <h3 className="bento-title">Entorno Vivo y Visita Directa</h3>
                  <p className="bento-sub">
                    Laderas arboladas de eucalipto y acompañamiento presencial de
                    nuestro equipo desde Cusco hasta el terreno
                  </p>
                </div>
              </article>

              <article className="bento-tile bento-top reveal-tile">
                <img
                  src={REAL_ASSETS.orthoEucalyptusEdge}
                  alt="Vista aérea de linderos rurales rodeados de bosques de eucalipto y vía de acceso en Anta"
                  loading="lazy"
                  decoding="async"
                  referrerPolicy="no-referrer"
                  className="bento-img"
                />
                <div className="bento-footer">
                  <h3 className="bento-title">Bosques y Acceso Directo</h3>
                  <p className="bento-sub">
                    Parcelas con cortina natural de eucaliptos y frente hacia
                    vía carrozable afirmada
                  </p>
                </div>
              </article>

              <article className="bento-tile bento-bottom reveal-tile">
                <canvas
                  ref={specsCanvasRef}
                  id="specs-gl-canvas"
                  className="specs-canvas"
                  aria-hidden="true"
                />
                <div className="bento-footer bento-footer-specs">
                  <div>
                    <h3 className="bento-title">Curvas de Nivel</h3>
                    <p className="bento-sub">
                      Levantamiento topográfico georreferenciado
                    </p>
                  </div>
                  <span className="spec-text-tag tabular-nums">
                    350 – 1,200 m²
                  </span>
                </div>
              </article>
            </div>
          </div>
        </section>

        {/* SECTION 5.5: Sobre ALASO, Brand Values & Official Advisors */}
        <BrandStorySection
          selectedAgent={selectedAgent}
          onScheduleWithAgent={handleScheduleWithAgent}
        />

        {/* SECTION 5.8: Verified Client Testimonials & Acquisition Stories */}
        <TestimonialsSection
          onConfigureParcel={handleConfigureParcel}
          onScheduleWithAgent={handleScheduleWithAgent}
        />

        {/* SECTION 6: Interactive Lot & Residence Configurator */}
        <section id="configurador" className="order-section">
          <div className="container order-grid">
            <div className="order-preview" id="order-preview">
              <img
                src={configuratorImage}
                alt={configuratorAlt}
                loading="lazy"
                decoding="async"
                referrerPolicy="no-referrer"
                className="order-estate-img"
                style={{ transform: `scale(${activeScale})` }}
              />
              <div className="order-preview-caption">
                <span>{activeSectorInfo.name}</span>
                <span aria-hidden="true">·</span>
                <span className="tabular-nums">{areaSqm} m²</span>
              </div>
            </div>

            <div className="order-panel">
              <div className="eyebrow-rule-row">
                <span className="eyebrow-text">Configurador de inversión</span>
                <span className="eyebrow-rule" aria-hidden="true" />
              </div>
              <h2 className="section-title">Diseña tu propiedad en Anta</h2>
              <p className="order-price tabular-nums" id="order-price">
                {formatUsd(estimatedUsd)}
              </p>

              <div className="config-group">
                <span className="config-label">Sector del Valle</span>
                <div className="option-row">
                  {(Object.keys(SECTORS) as SectorId[]).map((key) => {
                    const meta = SECTORS[key];
                    return (
                      <button
                        key={key}
                        type="button"
                        className={`pill-option${
                          sector === key ? ' is-active' : ''
                        }`}
                        onClick={() => setSector(key)}
                      >
                        <span
                          className="dot"
                          style={{ background: meta.dotColor }}
                        />
                        <span>{meta.shortName}</span>
                      </button>
                    );
                  })}
                </div>
              </div>

              <div className="config-group">
                <span className="config-label">Superficie del Lote</span>
                <div className="option-row">
                  {AREA_OPTIONS.map((opt) => (
                    <button
                      key={opt.sqm}
                      type="button"
                      className={`pill-option tabular-nums${
                        areaSqm === opt.sqm ? ' is-active' : ''
                      }`}
                      onClick={() => setAreaSqm(opt.sqm)}
                    >
                      {opt.label}
                    </button>
                  ))}
                </div>
              </div>

              <div className="config-group">
                <span className="config-label">Modalidad de Entrega</span>
                <div className="option-row">
                  <button
                    type="button"
                    className={`pill-option${
                      modality === 'terreno' ? ' is-active' : ''
                    }`}
                    onClick={() => setModality('terreno')}
                  >
                    Terreno Habilitado
                  </button>
                  <button
                    type="button"
                    className={`pill-option${
                      modality === 'villa' ? ' is-active' : ''
                    }`}
                    onClick={() => setModality('villa')}
                  >
                    Terreno + Villa Modular (+USD 68,000)
                  </button>
                </div>
              </div>

              <div className="spec-list">
                <div className="spec-row">
                  <span className="spec-key">Precio por m²</span>
                  <span className="spec-val tabular-nums">
                    USD {activeSectorInfo.pricePerSqmUsd} / m²
                  </span>
                </div>
                <div className="spec-row">
                  <span className="spec-key">Situación legal</span>
                  <span className="spec-val">
                    Título independiente · SUNARP Cusco
                  </span>
                </div>
                <div className="spec-row">
                  <span className="spec-key">Servicios básicos</span>
                  <span className="spec-val">
                    Acceso afirmado, energía y fibra óptica
                  </span>
                </div>
              </div>

              <button
                type="button"
                className="btn btn-primary btn-full"
                id="add-to-dossier-btn"
                onClick={addCurrentToDossier}
              >
                <span>
                  Agregar al Dossier y Agendar Visita — {formatUsd(estimatedUsd)}
                </span>
                <ArrowRight size={16} strokeWidth={2} />
              </button>
            </div>
          </div>
        </section>

        {/* SECTION 6.5: ALASO Granate Architectural CTA Banner */}
        <section className="alaso-cta-section" aria-label="Asesoría de proyecto">
          <div className="container">
            <div className="alaso-cta-banner">
              <img
                src={architecturalPavilion}
                alt=""
                aria-hidden="true"
                className="alaso-cta-backdrop"
              />
              <div className="alaso-cta-content">
                <h2 className="alaso-cta-title">
                  Tu próximo proyecto comienza aquí.
                </h2>
                <p className="alaso-cta-sub">
                  Conversemos sobre tus necesidades de terreno o vivienda y
                  encontremos la alternativa exacta para ti en Anta, Cusco.
                </p>
                <button
                  type="button"
                  className="btn btn-marfil"
                  onClick={() => setDrawerOpen(true)}
                >
                  <span>Hablemos de tu proyecto</span>
                  <ArrowRight size={16} strokeWidth={2} />
                </button>
              </div>
            </div>
          </div>
        </section>

        {/* SECTION 7: Media Studio (Real Drone Videos & Aerial Gallery + Admin CMS) */}
        <MediaStudioSection
          user={user}
          authReady={authReady}
          onShowcaseAssetsChange={handleShowcaseAssetsChange}
        />
      </main>

      <footer className="site-footer">
        <div className="container footer-inner">
          <div className="footer-brand-col">
            <a href="#hero" aria-label="ALASO Inicio">
              <AlasoLogo variant="dark-surface" height={50} />
            </a>
            <span className="footer-tag">
              Izcuchaca · Zurite · Huarocondo — Anta, Cusco, Perú
            </span>
          </div>

          <nav className="footer-nav" aria-label="Navegación pie de página">
            <a href="#showcase" className="footer-link">
              Sobrevuelos
            </a>
            <a href="#mapa" className="footer-link">
              Mapa
            </a>
            <a href="#nosotros" className="footer-link">
              Nosotros
            </a>
            <a href="#configurador" className="footer-link">
              Terrenos
            </a>
            <a href="#estudio" className="footer-link">
              Estudio
            </a>
          </nav>

          <div className="footer-meta-col">
            <span className="footer-copy">
              © 2026 ALASO — Constructora e Inmobiliaria
            </span>
          </div>
        </div>
      </footer>

      {/* Slide-Over Dossier & Visit Scheduling Drawer */}
      <div
        className="drawer-backdrop"
        id="drawer-backdrop"
        hidden={!drawerOpen}
        onClick={() => setDrawerOpen(false)}
      />
      <aside
        className="bag-drawer"
        id="bag-drawer"
        role="dialog"
        aria-modal="true"
        aria-labelledby="drawer-title"
        hidden={!drawerOpen}
      >
        <div className="drawer-header">
          <h2 id="drawer-title" className="drawer-title">
            Mi Dossier de Visita
          </h2>
          <button
            type="button"
            className="icon-btn"
            id="drawer-close"
            aria-label="Cerrar dossier"
            onClick={() => setDrawerOpen(false)}
          >
            <X size={18} strokeWidth={1.8} />
          </button>
        </div>

        <div className="drawer-body" id="drawer-body">
          {dossier.length === 0 ? (
            <div className="drawer-empty-inline">
              <p>
                Aún no has fijado un lote específico. Puedes enviar tu consulta
                con la configuración actual ({activeSectorInfo.shortName},{' '}
                {areaSqm} m²) o elegir otra parcela.
              </p>
            </div>
          ) : (
            <div className="drawer-items">
              {dossier.map((item) => (
                <div key={item.id} className="bag-item">
                  <img
                    src={SECTORS[item.sector].image}
                    alt={SECTORS[item.sector].name}
                    referrerPolicy="no-referrer"
                    className="bag-item-thumb"
                  />
                  <div className="bag-item-info">
                    <div className="bag-item-name">
                      {SECTORS[item.sector].name}
                    </div>
                    <div className="bag-item-meta tabular-nums">
                      {item.areaSqm} m² ·{' '}
                      {item.modality === 'villa'
                        ? 'Terreno + Villa'
                        : 'Solo Terreno'}{' '}
                      · {formatUsd(item.estimatedUsd)}
                    </div>
                    <button
                      type="button"
                      className="drawer-remove-link"
                      onClick={() => removeFromDossier(item.id)}
                    >
                      Quitar del dossier
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}

          <form className="inquiry-form" onSubmit={handleSubmitInquiry}>
            <h3 className="inquiry-heading">
              <Calendar size={16} strokeWidth={1.8} />
              <span>Agendar recorrido guiado en Anta</span>
            </h3>

            <label className="field-group">
              <span>Nombre completo</span>
              <input
                type="text"
                required
                minLength={2}
                maxLength={120}
                placeholder="Ej. Valeria Quispe"
                value={clientName}
                onChange={(e) => setClientName(e.target.value)}
              />
            </label>

            <label className="field-group">
              <span>Teléfono / WhatsApp</span>
              <input
                type="tel"
                required
                minLength={6}
                maxLength={40}
                placeholder="+51 984 000 000"
                value={clientPhone}
                onChange={(e) => setClientPhone(e.target.value)}
              />
            </label>

            <label className="field-group">
              <span>Fecha tentativa de visita</span>
              <input
                type="date"
                required
                value={visitDate}
                onChange={(e) => setVisitDate(e.target.value)}
              />
            </label>

            <label className="field-group">
              <span>Asesor asignado para el recorrido</span>
              <select
                value={selectedAgent}
                onChange={(e) => setSelectedAgent(e.target.value as AgentName)}
              >
                <option value="Alison Mariano">
                  Alison Mariano · Dirección y Saneamiento SUNARP
                </option>
                <option value="José Luis">
                  José Luis · Campo, Topografía y Dron 4K
                </option>
              </select>
            </label>

            <label className="field-group">
              <span>Notas o consulta específica</span>
              <textarea
                rows={3}
                maxLength={800}
                placeholder="Indica si prefieres recojo desde Cusco o información de financiamiento."
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
              />
            </label>

            {inquiryError && (
              <p className="studio-feedback error">{inquiryError}</p>
            )}
            {inquirySuccess && (
              <div className="inquiry-success-box">
                <Check size={16} strokeWidth={2} />
                <span>{inquirySuccess}</span>
              </div>
            )}

            <button
              type="submit"
              className="btn btn-primary btn-full"
              disabled={submittingInquiry}
            >
              <span>
                {submittingInquiry
                  ? 'Guardando solicitud...'
                  : user
                    ? 'Confirmar Visita en Anta'
                    : 'Conectar con Google y Confirmar'}
              </span>
              <ArrowRight size={16} strokeWidth={2} />
            </button>
          </form>

          {myInquiries.length > 0 && (
            <div className="saved-inquiries-block">
              <h4 className="saved-inquiries-title">
                Tus visitas registradas
              </h4>
              <ul className="saved-inquiries-list">
                {myInquiries.map((inq) => (
                  <li key={inq.id} className="saved-inquiry-item">
                    <div>
                      <strong>{SECTORS[inq.sector]?.name || inq.sector}</strong>
                      <div className="saved-inquiry-meta tabular-nums">
                        {inq.areaSqm} m² · Visita: {inq.visitDate} ·{' '}
                        {formatUsd(inq.estimatedUsd)}
                      </div>
                    </div>
                    <span className="saved-inquiry-status">
                      {inq.status === 'pending'
                        ? 'Pendiente'
                        : inq.status === 'scheduled'
                          ? 'Programada'
                          : 'Completada'}
                    </span>
                  </li>
                ))}
              </ul>
            </div>
          )}
        </div>
      </aside>
    </>
  );
}
