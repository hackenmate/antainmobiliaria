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
  ArrowUp,
  ArrowUpRight,
  Calendar,
  Check,
  DraftingCompass,
  Film,
  Handshake,
  HardHat,
  Home,
  MapPin,
  Menu,
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
import {
  AdvisorsSection,
  BrandStorySection,
} from './components/BrandStorySection';
import { TestimonialsSection } from './components/TestimonialsSection';
import { SectorCatalogGrid } from './components/SectorCatalogGrid';
import { PurchaseFaqSection } from './components/PurchaseFaqSection';
import { AntaWeatherCard } from './components/AntaWeatherCard';
import {
  MediaStudioSection,
  getYoutubeEmbedUrl,
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

const REFERENTIAL_FX_PEN = 3.75;

const NAV_LINKS = [
  { id: 'nosotros', label: 'Nosotros' },
  { id: 'configurador', label: 'Terrenos' },
  { id: 'mapa', label: 'Mapa' },
  { id: 'showcase', label: 'Sobrevuelos' },
  { id: 'proceso', label: 'Proceso' },
] as const;

function formatAmount(amountUsd: number, currency: 'USD' | 'PEN'): string {
  const val = currency === 'PEN' ? Math.round(amountUsd * REFERENTIAL_FX_PEN) : amountUsd;
  return new Intl.NumberFormat('es-PE', {
    style: 'currency',
    currency,
    maximumFractionDigits: 0,
  }).format(val);
}

export default function App() {
  // Always open in light Marfil theme matching the ALASO reference specification
  const [theme, setTheme] = useState<'dark' | 'light'>('light');
  const [quotaExceeded, setQuotaExceeded] = useState(false);

  // Navigation, scroll progress, mobile menu & toast UX complements
  const [scrollProgress, setScrollProgress] = useState<number>(0);
  const [activeNavId, setActiveNavId] = useState<string>('');
  const [showBackToTop, setShowBackToTop] = useState<boolean>(false);
  const [mobileNavOpen, setMobileNavOpen] = useState<boolean>(false);
  const [toastMessage, setToastMessage] = useState<string | null>(null);
  const toastTimerRef = useRef<number | null>(null);

  // Active configuration & financial simulator state
  const [sector, setSector] = useState<SectorId>('izcuchaca');
  const [areaSqm, setAreaSqm] = useState<number>(600);
  const [modality, setModality] = useState<ModalityId>('terreno');
  const [currency, setCurrency] = useState<'USD' | 'PEN'>('USD');
  const [downPct, setDownPct] = useState<20 | 30 | 50>(30);
  const [termMonths, setTermMonths] = useState<0 | 12 | 24 | 36>(24);

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
    const customVideos = customShowcase.filter((m) => m.mediaType === 'video');
    if (customVideos.length === 0) return DEFAULT_SHOWCASE_SLIDES;

    const mapped: ShowcaseSlide[] = customVideos.map((m) => ({
      id: m.id,
      mediaType: 'video',
      url: m.url,
      poster: m.poster || REAL_ASSETS.orthoFullBlock,
      alt: m.title,
      title: m.title,
      subtitle: m.subtitle || 'ALASO Constructora e Inmobiliaria · Anta, Cusco',
      sector: m.sector,
    }));

    const merged = [...mapped];
    for (const def of DEFAULT_SHOWCASE_SLIDES) {
      if (!merged.some((item) => item.url === def.url)) {
        merged.push(def);
      }
    }
    return merged;
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

  // Dynamic GSAP ScrollTrigger for the video-only Sobrevuelos cluster
  useEffect(() => {
    const prefersReduced = window.matchMedia(
      '(prefers-reduced-motion: reduce)'
    ).matches;
    const total = showcaseSlides.length;
    frameRefs.current = frameRefs.current.slice(0, total);
    setActiveStage((prev) => (prev >= total ? 0 : prev));
    stageIdxRef.current = 0;

    if (prefersReduced || !showcaseRef.current || total < 2) return;

    const frames = frameRefs.current.filter(
      (el): el is HTMLElement => el !== null
    );
    if (frames.length < 2) return;

    const ctx = gsap.context(() => {
      const transitions = frames.length - 1;
      const totalDuration = transitions * 1.15;

      const tl = gsap.timeline({
        scrollTrigger: {
          trigger: showcaseRef.current,
          start: 'top top',
          end: `+=${transitions * 135}%`,
          pin: true,
          scrub: 0.6,
          onUpdate: (self: { progress: number }) => {
            const nextIdx = Math.min(
              frames.length - 1,
              Math.floor(self.progress * frames.length)
            );

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

      frames.forEach((frame, i) => {
        if (i === 0) return;
        const startAt = (i - 1) * 1.15 + 0.18;
        tl.fromTo(
          frame,
          { clipPath: 'inset(0 0 0 100%)' },
          { clipPath: 'inset(0 0 0 0%)', ease: 'none', duration: 0.8 },
          startAt
        );
      });
      tl.set({}, {}, totalDuration);
    });

    ScrollTrigger.sort();
    ScrollTrigger.refresh();

    return () => {
      ctx.revert();
    };
  }, [showcaseSlides.length]);

  useEffect(() => {
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        if (drawerOpen) setDrawerOpen(false);
        if (mobileNavOpen) setMobileNavOpen(false);
      }
    };
    document.addEventListener('keydown', onKeyDown);
    return () => document.removeEventListener('keydown', onKeyDown);
  }, [drawerOpen, mobileNavOpen]);

  // Scroll-spy active nav item & reading progress bar
  useEffect(() => {
    const sectionIds = NAV_LINKS.map((l) => l.id);
    const onScroll = () => {
      const y = window.scrollY;
      const docHeight =
        document.documentElement.scrollHeight - window.innerHeight;
      setScrollProgress(
        docHeight > 0 ? Math.min(100, Math.max(0, (y / docHeight) * 100)) : 0
      );
      setShowBackToTop(y > 680);

      let current = '';
      for (const id of sectionIds) {
        const el = document.getElementById(id);
        if (!el) continue;
        const rect = el.getBoundingClientRect();
        if (rect.top <= 160 && rect.bottom >= 140) {
          current = id;
          break;
        }
      }
      setActiveNavId(current);
    };

    onScroll();
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => {
      window.removeEventListener('scroll', onScroll);
      if (toastTimerRef.current !== null) {
        window.clearTimeout(toastTimerRef.current);
      }
    };
  }, []);

  const showToast = useCallback((msg: string) => {
    setToastMessage(msg);
    if (toastTimerRef.current !== null) {
      window.clearTimeout(toastTimerRef.current);
    }
    toastTimerRef.current = window.setTimeout(() => {
      setToastMessage(null);
      toastTimerRef.current = null;
    }, 3200);
  }, []);

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

  const downPaymentUsd =
    termMonths === 0 ? estimatedUsd : Math.round((estimatedUsd * downPct) / 100);
  const financedBalanceUsd = Math.max(0, estimatedUsd - downPaymentUsd);
  const monthlyPaymentUsd =
    termMonths === 0 ? 0 : Math.round(financedBalanceUsd / termMonths);

  const savedSectors = useMemo(
    () => Array.from(new Set(dossier.map((item) => item.sector))),
    [dossier]
  );

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

  const handleToggleSaveSector = (sid: SectorId) => {
    const alreadySaved = dossier.some((d) => d.sector === sid);
    if (alreadySaved) {
      setDossier((prev) => prev.filter((d) => d.sector !== sid));
      showToast(`${SECTORS[sid].shortName} retirado del dossier.`);
      return;
    }
    const baseUsd = 600 * SECTORS[sid].pricePerSqmUsd;
    setDossier((prev) => [
      ...prev,
      {
        id: `${sid}-600-terreno`,
        sector: sid,
        areaSqm: 600,
        modality: 'terreno',
        estimatedUsd: baseUsd,
      },
    ]);
    showToast(`${SECTORS[sid].shortName} (600 m²) guardado en tu dossier.`);
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

      const paymentSummary =
        termMonths === 0
          ? 'Pago al contado'
          : `Inicial ${downPct}% (${formatAmount(downPaymentUsd, 'USD')}) + ${termMonths} cuotas ref.`;

      const formattedNotes = `[Asesor: ${selectedAgent} · ${paymentSummary}]${
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

  const handleInspectSectorOnMap = (sid: SectorId) => {
    setSector(sid);
    document.getElementById('mapa')?.scrollIntoView({ behavior: 'smooth' });
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
            {NAV_LINKS.map((link) => (
              <a
                key={link.id}
                href={`#${link.id}`}
                className={`nav-link${activeNavId === link.id ? ' is-active' : ''}`}
              >
                {link.label}
              </a>
            ))}
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

            <button
              type="button"
              className="mobile-menu-btn"
              aria-label={mobileNavOpen ? 'Cerrar menú' : 'Abrir menú de navegación'}
              aria-expanded={mobileNavOpen}
              onClick={() => setMobileNavOpen((prev) => !prev)}
            >
              {mobileNavOpen ? (
                <X size={20} strokeWidth={2} />
              ) : (
                <Menu size={20} strokeWidth={2} />
              )}
            </button>
          </div>
        </div>

        <div
          className="scroll-progress-track"
          aria-hidden="true"
        >
          <div
            className="scroll-progress-bar"
            style={{ width: `${scrollProgress.toFixed(1)}%` }}
          />
        </div>
      </header>

      {mobileNavOpen && (
        <div className="mobile-nav-panel" role="dialog" aria-label="Menú móvil">
          <nav className="mobile-nav-links">
            {NAV_LINKS.map((link) => (
              <a
                key={link.id}
                href={`#${link.id}`}
                className={`mobile-nav-link${
                  activeNavId === link.id ? ' is-active' : ''
                }`}
                onClick={() => setMobileNavOpen(false)}
              >
                <span>{link.label}</span>
                <ArrowRight size={15} strokeWidth={1.9} />
              </a>
            ))}
            <a
              href="#estudio"
              className="mobile-nav-link"
              onClick={() => setMobileNavOpen(false)}
            >
              <span>Archivo Audiovisual</span>
              <ArrowRight size={15} strokeWidth={1.9} />
            </a>
          </nav>
        </div>
      )}

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

        {/* ACT 1: Corporate Identity — Sobre ALASO, Misión & Visión */}
        <BrandStorySection />

        {/* ACT 2: Real Estate Offer — Sector Comparison & Lot Configurator */}
        <section id="configurador" className="order-section">
          <div className="container">
            <SectorCatalogGrid
              activeSector={sector}
              currency={currency}
              fxRate={REFERENTIAL_FX_PEN}
              savedSectors={savedSectors}
              onSelectSector={(sid) => {
                setSector(sid);
                document
                  .getElementById('order-panel')
                  ?.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
              }}
              onToggleSaveSector={handleToggleSaveSector}
              onInspectOnMap={handleInspectSectorOnMap}
            />

            <div className="order-grid">
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

              <div className="order-panel" id="order-panel">
                <div className="eyebrow-rule-row">
                  <span className="eyebrow-text">Configurador de inversión</span>
                  <span className="eyebrow-rule" aria-hidden="true" />
                </div>
                <h2 className="section-title">Diseña tu propiedad en Anta</h2>

                <div className="order-price-row">
                  <div>
                    <p className="order-price tabular-nums" id="order-price">
                      {formatAmount(estimatedUsd, currency)}
                    </p>
                    <span className="order-price-note">
                      {currency === 'PEN'
                        ? `Referencial S/ ${REFERENTIAL_FX_PEN.toFixed(2)} por USD (${formatAmount(estimatedUsd, 'USD')})`
                        : `Equiv. ref. ${formatAmount(estimatedUsd, 'PEN')} (T.C. ${REFERENTIAL_FX_PEN.toFixed(2)})`}
                    </span>
                  </div>

                  <div
                    className="currency-switch"
                    role="tablist"
                    aria-label="Moneda de cotización"
                  >
                    <button
                      type="button"
                      role="tab"
                      aria-selected={currency === 'USD'}
                      className={`currency-btn${currency === 'USD' ? ' is-active' : ''}`}
                      onClick={() => setCurrency('USD')}
                    >
                      USD
                    </button>
                    <button
                      type="button"
                      role="tab"
                      aria-selected={currency === 'PEN'}
                      className={`currency-btn${currency === 'PEN' ? ' is-active' : ''}`}
                      onClick={() => setCurrency('PEN')}
                    >
                      S/ PEN
                    </button>
                  </div>
                </div>

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
                      Terreno + Villa Modular (+{formatAmount(VILLA_BUILD_SURCHARGE_USD, currency)})
                    </button>
                  </div>
                </div>

                {/* Simulador de Inicial y Cuotas Directas */}
                <div className="financing-box">
                  <div className="financing-head">
                    <span className="config-label">
                      Simulador de pago referencial (sin trámite bancario)
                    </span>
                  </div>

                  <div className="financing-controls">
                    <div className="option-row">
                      {([0, 12, 24, 36] as const).map((months) => (
                        <button
                          key={months}
                          type="button"
                          className={`pill-option pill-compact tabular-nums${
                            termMonths === months ? ' is-active' : ''
                          }`}
                          onClick={() => setTermMonths(months)}
                        >
                          {months === 0 ? 'Contado' : `${months} cuotas`}
                        </button>
                      ))}
                    </div>

                    {termMonths > 0 && (
                      <div className="option-row">
                        {([20, 30, 50] as const).map((pct) => (
                          <button
                            key={pct}
                            type="button"
                            className={`pill-option pill-compact tabular-nums${
                              downPct === pct ? ' is-active' : ''
                            }`}
                            onClick={() => setDownPct(pct)}
                          >
                            Inicial {pct}%
                          </button>
                        ))}
                      </div>
                    )}
                  </div>

                  <div className="financing-summary tabular-nums">
                    <div>
                      <span className="financing-label">
                        {termMonths === 0
                          ? 'Inversión total al contado'
                          : `Inicial (${downPct}%)`}
                      </span>
                      <strong className="financing-val">
                        {formatAmount(downPaymentUsd, currency)}
                      </strong>
                    </div>
                    <div>
                      <span className="financing-label">
                        {termMonths === 0
                          ? 'Entrega documental'
                          : `${termMonths} cuotas mensuales est.`}
                      </span>
                      <strong className="financing-val">
                        {termMonths === 0
                          ? 'Minuta inmediata'
                          : `${formatAmount(monthlyPaymentUsd, currency)} / mes`}
                      </strong>
                    </div>
                  </div>
                </div>

                <div className="spec-list">
                  <div className="spec-row">
                    <span className="spec-key">Precio por m²</span>
                    <span className="spec-val tabular-nums">
                      {formatAmount(activeSectorInfo.pricePerSqmUsd, currency)} / m²
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

                <div className="order-cta-stack">
                  <button
                    type="button"
                    className="btn btn-primary btn-full"
                    id="add-to-dossier-btn"
                    onClick={addCurrentToDossier}
                  >
                    <span>
                      Agregar al Dossier y Agendar Visita —{' '}
                      {formatAmount(estimatedUsd, currency)}
                    </span>
                    <ArrowRight size={16} strokeWidth={2} />
                  </button>

                  <button
                    type="button"
                    className="order-map-jump-btn"
                    onClick={() => handleInspectSectorOnMap(sector)}
                  >
                    <MapPin size={14} strokeWidth={1.9} />
                    <span>Ubicar {activeSectorInfo.shortName} en el mapa en vivo</span>
                  </button>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* ACT 3: Territory, Engineering & Live Anta Climate */}
        <AntaInteractiveMap
          activeSector={sector}
          onSelectSector={setSector}
          onConfigureSector={handleConfigureFromMap}
        />

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

        <section id="especificaciones" className="bento-section">
          <div className="container">
            <div className="section-header-stack">
              <div className="eyebrow-rule-row">
                <span className="eyebrow-text">
                  Presencia en campo, arquitectura y clima
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

              <AntaWeatherCard activeSector={sector} />
            </div>
          </div>
        </section>

        {/* ACT 4: Unified Audiovisual Evidence — Drone Flyover Videos + Media Archive */}
        <section id="showcase" ref={showcaseRef} className="showcase-pin">
          <div className="showcase-viewport" id="showcase-viewport">
            <div className="showcase-frames" id="showcase-frames">
              {showcaseSlides.map((slide, i) => {
                const ytEmbed = getYoutubeEmbedUrl(slide.url);
                return (
                  <figure
                    key={`${slide.id}-${i}`}
                    ref={(el: HTMLElement | null) => {
                      frameRefs.current[i] = el;
                    }}
                    className={`showcase-frame${i === 0 ? ' is-active' : ''}`}
                    data-index={i}
                  >
                    {ytEmbed ? (
                      showcaseInView && activeStage === i ? (
                        <iframe
                          src={ytEmbed}
                          title={slide.title}
                          className="showcase-img"
                          allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                          allowFullScreen
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
                    ) : showcaseInView && activeStage === i ? (
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
                    )}
                  </figure>
                );
              })}
            </div>

            <div className="showcase-hud">
              <div
                className={`showcase-caption${captionBlur ? ' is-blurring' : ''}`}
                id="showcase-caption"
              >
                <span className="showcase-type-kicker tabular-nums">
                  Sobrevuelos en Dron 4K · Video {activeStage + 1} de{' '}
                  {showcaseSlides.length}
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
                aria-label="Seleccionar video de sobrevuelo en dron"
              >
                {showcaseSlides.map((slide, i) => (
                  <button
                    key={`${slide.id}-tab-${i}`}
                    type="button"
                    role="tab"
                    aria-selected={activeStage === i}
                    className={`stage-video-tab tabular-nums${
                      activeStage === i ? ' is-active' : ''
                    }`}
                    aria-label={`Ver sobrevuelo ${i + 1}: ${slide.title}`}
                    onClick={() => selectStage(i)}
                  >
                    <span className="stage-video-num">
                      {String(i + 1).padStart(2, '0')}
                    </span>
                    <span className="stage-video-name">
                      {slide.title.split('·')[0].trim()}
                    </span>
                  </button>
                ))}
              </div>
            </div>
          </div>
        </section>

        <MediaStudioSection
          user={user}
          authReady={authReady}
          onShowcaseAssetsChange={handleShowcaseAssetsChange}
        />

        {/* ACT 5: Human Trust, Purchase Process & Closing CTA */}
        <AdvisorsSection
          selectedAgent={selectedAgent}
          onScheduleWithAgent={handleScheduleWithAgent}
        />

        <TestimonialsSection
          onConfigureParcel={handleConfigureParcel}
          onScheduleWithAgent={handleScheduleWithAgent}
        />

        <PurchaseFaqSection onOpenDossier={() => setDrawerOpen(true)} />

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
            <a href="#nosotros" className="footer-link">
              Nosotros
            </a>
            <a href="#configurador" className="footer-link">
              Terrenos
            </a>
            <a href="#mapa" className="footer-link">
              Mapa
            </a>
            <a href="#showcase" className="footer-link">
              Sobrevuelos
            </a>
            <a href="#estudio" className="footer-link">
              Estudio
            </a>
            <a href="#proceso" className="footer-link">
              Proceso
            </a>
          </nav>

          <div className="footer-meta-col">
            <span className="footer-copy">
              © 2026 ALASO — Constructora e Inmobiliaria
            </span>
          </div>
        </div>
      </footer>

      {toastMessage && (
        <div className="alaso-toast" role="status" aria-live="polite">
          <Check size={15} strokeWidth={2.2} />
          <span>{toastMessage}</span>
        </div>
      )}

      {showBackToTop && (
        <button
          type="button"
          className="back-to-top-btn"
          aria-label="Volver arriba"
          onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}
        >
          <ArrowUp size={18} strokeWidth={2} />
        </button>
      )}

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
                      · {formatAmount(item.estimatedUsd, currency)}
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
                        {formatAmount(inq.estimatedUsd, 'USD')}
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
