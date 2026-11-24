import { useEffect, useMemo, useState, type FormEvent } from 'react';
import {
  addDoc,
  collection,
  deleteDoc,
  doc,
  getDocs,
  onSnapshot,
  orderBy,
  query,
  serverTimestamp,
} from 'firebase/firestore';
import { signInWithPopup, signOut, type User } from 'firebase/auth';
import {
  ChevronLeft,
  ChevronRight,
  Expand,
  Film,
  Image as ImageIcon,
  Play,
  Plus,
  Trash2,
  UploadCloud,
  X,
} from 'lucide-react';
import {
  ADMIN_EMAIL,
  OperationType,
  auth,
  db,
  googleProvider,
  handleFirestoreError,
  popupRedirectResolver,
} from '../firebase';
import {
  REAL_ARCHIVE_ITEMS,
  type ArchiveCategory,
  type SectorId,
} from '../data/properties';

export interface MediaAssetRecord {
  id: string;
  title: string;
  subtitle: string;
  mediaType: 'image' | 'video';
  url: string;
  poster?: string;
  category?: ArchiveCategory;
  placement: 'showcase' | 'gallery';
  sector: SectorId | 'general';
  sortOrder: number;
  authorUid: string;
}

interface MediaStudioSectionProps {
  user: User | null;
  authReady: boolean;
  onShowcaseAssetsChange: (assets: MediaAssetRecord[]) => void;
}

type FilterKey = 'all' | ArchiveCategory;

const FILTER_TABS: { key: FilterKey; label: string }[] = [
  { key: 'all', label: 'Todo el archivo' },
  { key: 'drone-video', label: 'Videos Dron' },
  { key: 'panoramic', label: 'Panorámicas' },
  { key: 'orthophoto', label: 'Ortofotos' },
  { key: 'field', label: 'Campo y Entorno' },
];

function getYoutubeEmbedUrl(rawUrl: string): string | null {
  try {
    const parsed = new URL(rawUrl);
    if (
      parsed.hostname.includes('youtube.com') ||
      parsed.hostname.includes('youtu.be')
    ) {
      let videoId = '';
      if (parsed.hostname.includes('youtu.be')) {
        videoId = parsed.pathname.replace('/', '').trim();
      } else if (parsed.pathname.includes('/embed/')) {
        videoId = parsed.pathname.split('/embed/')[1]?.split('/')[0] || '';
      } else {
        videoId = parsed.searchParams.get('v') || '';
      }
      if (videoId) {
        return `https://www.youtube.com/embed/${videoId}?rel=0`;
      }
    }
  } catch {
    return null;
  }
  return null;
}

const ARCHIVE_AS_RECORDS: MediaAssetRecord[] = REAL_ARCHIVE_ITEMS.map((item) => ({
  id: item.id,
  title: item.title,
  subtitle: item.subtitle,
  mediaType: item.mediaType,
  url: item.url,
  poster: item.poster,
  category: item.category,
  placement: 'gallery',
  sector: item.sector,
  sortOrder: item.sortOrder + 100,
  authorUid: 'system',
}));

export function MediaStudioSection({
  user,
  authReady,
  onShowcaseAssetsChange,
}: MediaStudioSectionProps) {
  const [assets, setAssets] = useState<MediaAssetRecord[]>([]);
  const [activeFilter, setActiveFilter] = useState<FilterKey>('all');
  const [lightboxIndex, setLightboxIndex] = useState<number | null>(null);
  const [editorOpen, setEditorOpen] = useState(false);
  const [title, setTitle] = useState('');
  const [subtitle, setSubtitle] = useState('');
  const [mediaType, setMediaType] = useState<'image' | 'video'>('video');
  const [url, setUrl] = useState('');
  const [placement, setPlacement] = useState<'showcase' | 'gallery'>('gallery');
  const [sector, setSector] = useState<SectorId | 'general'>('izcuchaca');
  const [submitting, setSubmitting] = useState(false);
  const [feedback, setFeedback] = useState<string | null>(null);
  const [authError, setAuthError] = useState<string | null>(null);

  const isAdmin =
    Boolean(user?.emailVerified) &&
    user?.email?.toLowerCase() === ADMIN_EMAIL.toLowerCase();

  useEffect(() => {
    if (!authReady) return;

    const q = query(
      collection(db, 'mediaAssets'),
      orderBy('sortOrder', 'asc')
    );

    const mapSnapshot = (
      docs: Array<{ id: string; data: () => Record<string, unknown> }>
    ) => {
      const loaded: MediaAssetRecord[] = docs.map((d) => {
        const data = d.data();
        const mType = data.mediaType === 'video' ? 'video' : 'image';
        return {
          id: d.id,
          title: String(data.title || ''),
          subtitle: String(data.subtitle || ''),
          mediaType: mType,
          url: String(data.url || ''),
          category: mType === 'video' ? 'drone-video' : 'field',
          placement: data.placement === 'showcase' ? 'showcase' : 'gallery',
          sector: (data.sector as SectorId | 'general') || 'general',
          sortOrder: Number(data.sortOrder ?? 1),
          authorUid: String(data.authorUid || ''),
        };
      });
      setAssets(loaded);
      onShowcaseAssetsChange(
        loaded.filter((item) => item.placement === 'showcase')
      );
    };

    if (user?.emailVerified) {
      const unsubscribe = onSnapshot(
        q,
        (snapshot) => {
          mapSnapshot(snapshot.docs);
        },
        (err) => {
          handleFirestoreError(err, OperationType.LIST, 'mediaAssets');
        }
      );

      return () => unsubscribe();
    }

    let cancelled = false;
    const loadPublicAssets = async () => {
      try {
        const snapshot = await getDocs(q);
        if (!cancelled) {
          mapSnapshot(snapshot.docs);
        }
      } catch (err) {
        if (
          err instanceof Error &&
          err.message.includes('Missing or insufficient permissions')
        ) {
          handleFirestoreError(err, OperationType.LIST, 'mediaAssets');
        }
      }
    };

    void loadPublicAssets();
    return () => {
      cancelled = true;
    };
  }, [authReady, user, onShowcaseAssetsChange]);

  const allGalleryItems = useMemo(() => {
    const uploadedGallery = assets.filter((a) => a.placement === 'gallery');
    return [...uploadedGallery, ...ARCHIVE_AS_RECORDS];
  }, [assets]);

  const filteredItems = useMemo(() => {
    if (activeFilter === 'all') return allGalleryItems;
    return allGalleryItems.filter((item) => item.category === activeFilter);
  }, [allGalleryItems, activeFilter]);

  useEffect(() => {
    if (lightboxIndex === null) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        setLightboxIndex(null);
      } else if (e.key === 'ArrowRight') {
        setLightboxIndex((prev) =>
          prev === null ? null : (prev + 1) % filteredItems.length
        );
      } else if (e.key === 'ArrowLeft') {
        setLightboxIndex((prev) =>
          prev === null
            ? null
            : (prev - 1 + filteredItems.length) % filteredItems.length
        );
      }
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [lightboxIndex, filteredItems.length]);

  const handleSignIn = async () => {
    setAuthError(null);
    try {
      await signInWithPopup(auth, googleProvider, popupRedirectResolver);
      setEditorOpen(true);
    } catch (err: unknown) {
      setAuthError(
        err instanceof Error
          ? err.message
          : 'No se pudo iniciar sesión con Google.'
      );
    }
  };

  const handlePublishMedia = async (e: FormEvent) => {
    e.preventDefault();
    if (!user || !isAdmin) return;
    const cleanTitle = title.trim().slice(0, 120);
    const cleanSub = subtitle.trim().slice(0, 240);
    const cleanUrl = url.trim().slice(0, 1000);

    if (cleanTitle.length < 2 || !/^(https?:\/\/|\/).+$/i.test(cleanUrl)) {
      setFeedback(
        'Ingresa un título válido y una ruta/URL que empiece con https:// o /.'
      );
      return;
    }

    setSubmitting(true);
    setFeedback(null);
    try {
      await addDoc(collection(db, 'mediaAssets'), {
        title: cleanTitle,
        subtitle: cleanSub,
        mediaType,
        url: cleanUrl,
        placement,
        sector,
        sortOrder: assets.length + 1,
        authorUid: user.uid,
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
      });
      setTitle('');
      setSubtitle('');
      setUrl('');
      setFeedback('Material publicado y sincronizado en la web.');
    } catch (err: unknown) {
      handleFirestoreError(err, OperationType.CREATE, 'mediaAssets');
    } finally {
      setSubmitting(false);
    }
  };

  const handleDeleteAsset = async (assetId: string) => {
    if (!isAdmin) return;
    try {
      await deleteDoc(doc(db, 'mediaAssets', assetId));
    } catch (err: unknown) {
      handleFirestoreError(
        err,
        OperationType.DELETE,
        `mediaAssets/${assetId}`
      );
    }
  };

  const activeLightboxItem =
    lightboxIndex !== null ? filteredItems[lightboxIndex] ?? null : null;

  return (
    <section id="estudio" className="studio-section">
      <div className="container">
        <div className="studio-header">
          <div>
            <div className="eyebrow-rule-row">
              <span className="eyebrow-text">
                Archivo audiovisual real · Dron DJI y reconocimiento de campo
              </span>
              <span className="eyebrow-rule" aria-hidden="true" />
            </div>
            <h2 className="section-title">Archivo Audiovisual ALASO.</h2>
            <p className="section-sub">
              Explora nuestras tomas aéreas reales, vuelos 4K en dron sobre el
              polígono de terrenos y visitas en sitio. Haz clic en cualquier
              pieza para inspeccionarla a pantalla completa.
            </p>
          </div>

          <div className="studio-actions">
            {user ? (
              <div className="studio-auth-row">
                <button
                  type="button"
                  className="btn btn-primary btn-sm"
                  onClick={() => setEditorOpen((prev) => !prev)}
                >
                  <UploadCloud size={16} strokeWidth={1.8} />
                  <span>
                    {editorOpen ? 'Ocultar cargador' : 'Agregar video o foto'}
                  </span>
                </button>
                <button
                  type="button"
                  className="btn btn-outline btn-sm"
                  onClick={() => void signOut(auth)}
                >
                  Salir ({user.email?.split('@')[0]})
                </button>
              </div>
            ) : (
              <button
                type="button"
                className="btn btn-outline btn-sm"
                onClick={() => void handleSignIn()}
              >
                <UploadCloud size={16} strokeWidth={1.8} />
                <span>Administrar videos y fotos</span>
              </button>
            )}
          </div>
        </div>

        <div
          className="studio-filter-bar"
          role="tablist"
          aria-label="Filtrar archivo audiovisual"
        >
          {FILTER_TABS.map((tab) => {
            const count =
              tab.key === 'all'
                ? allGalleryItems.length
                : allGalleryItems.filter((i) => i.category === tab.key).length;
            return (
              <button
                key={tab.key}
                type="button"
                role="tab"
                aria-selected={activeFilter === tab.key}
                className={`studio-filter-btn${
                  activeFilter === tab.key ? ' is-active' : ''
                }`}
                onClick={() => {
                  setActiveFilter(tab.key);
                  setLightboxIndex(null);
                }}
              >
                <span>{tab.label}</span>
                <span className="studio-filter-count tabular-nums">{count}</span>
              </button>
            );
          })}
        </div>

        {authError && <p className="studio-feedback error">{authError}</p>}

        {editorOpen && user && (
          <div className="studio-uploader-card">
            {isAdmin ? (
              <form className="studio-form" onSubmit={handlePublishMedia}>
                <div className="studio-form-grid">
                  <label className="field-group">
                    <span>Título de la pieza</span>
                    <input
                      type="text"
                      required
                      minLength={2}
                      maxLength={120}
                      placeholder="Ej. Sobrevuelo Dron Valle de Izcuchaca"
                      value={title}
                      onChange={(e) => setTitle(e.target.value)}
                    />
                  </label>

                  <label className="field-group">
                    <span>Subtítulo o descripción breve</span>
                    <input
                      type="text"
                      maxLength={240}
                      placeholder="Ej. Toma aérea 4K de lotes A1-A8 al amanecer"
                      value={subtitle}
                      onChange={(e) => setSubtitle(e.target.value)}
                    />
                  </label>

                  <label className="field-group">
                    <span>Tipo de contenido</span>
                    <select
                      value={mediaType}
                      onChange={(e) =>
                        setMediaType(e.target.value as 'image' | 'video')
                      }
                    >
                      <option value="video">Video (MP4 o YouTube)</option>
                      <option value="image">Fotografía (JPG / WebP / PNG)</option>
                    </select>
                  </label>

                  <label className="field-group">
                    <span>Ubicación en la página</span>
                    <select
                      value={placement}
                      onChange={(e) =>
                        setPlacement(
                          e.target.value as 'showcase' | 'gallery'
                        )
                      }
                    >
                      <option value="gallery">Galería de Medios</option>
                      <option value="showcase">
                        Escaparate Principal (Pantalla completa)
                      </option>
                    </select>
                  </label>

                  <label className="field-group">
                    <span>Sector de Anta</span>
                    <select
                      value={sector}
                      onChange={(e) =>
                        setSector(e.target.value as SectorId | 'general')
                      }
                    >
                      <option value="izcuchaca">Valle de Izcuchaca</option>
                      <option value="zurite">Laderas de Zurite</option>
                      <option value="huarocondo">Mirador Huarocondo</option>
                      <option value="general">General ALASO Anta</option>
                    </select>
                  </label>

                  <label className="field-group">
                    <span>URL o ruta del video / imagen</span>
                    <input
                      type="text"
                      required
                      maxLength={1000}
                      placeholder="https://... o /assets/aistudio/..."
                      value={url}
                      onChange={(e) => setUrl(e.target.value)}
                    />
                  </label>
                </div>

                <div className="studio-form-footer">
                  {feedback && <p className="studio-feedback">{feedback}</p>}
                  <button
                    type="submit"
                    className="btn btn-primary btn-sm"
                    disabled={submitting}
                  >
                    <Plus size={16} strokeWidth={2} />
                    <span>
                      {submitting ? 'Publicando...' : 'Publicar en la web'}
                    </span>
                  </button>
                </div>
              </form>
            ) : (
              <p className="studio-feedback">
                Has iniciado sesión como {user.email}. Solo el administrador
                autorizado ({ADMIN_EMAIL}) puede publicar nuevos videos o
                fotografías oficiales.
              </p>
            )}
          </div>
        )}

        <div className="studio-gallery-grid">
          {filteredItems.map((item, idx) => {
            const ytEmbed =
              item.mediaType === 'video' ? getYoutubeEmbedUrl(item.url) : null;
            const isSystemArchive = item.authorUid === 'system';
            return (
              <article key={item.id} className="studio-media-card">
                <div className="studio-media-frame">
                  {item.mediaType === 'video' ? (
                    ytEmbed ? (
                      <iframe
                        src={ytEmbed}
                        title={item.title}
                        className="studio-media-el"
                        allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                        allowFullScreen
                      />
                    ) : (
                      <video
                        src={item.url}
                        poster={item.poster}
                        controls
                        playsInline
                        preload="none"
                        className="studio-media-el"
                      />
                    )
                  ) : (
                    <img
                      src={item.url}
                      alt={item.title}
                      loading="lazy"
                      referrerPolicy="no-referrer"
                      className="studio-media-el"
                    />
                  )}

                  <button
                    type="button"
                    className="studio-expand-btn"
                    aria-label={`Ampliar ${item.title}`}
                    onClick={() => setLightboxIndex(idx)}
                  >
                    {item.mediaType === 'video' ? (
                      <Play size={14} strokeWidth={2} />
                    ) : (
                      <Expand size={14} strokeWidth={2} />
                    )}
                    <span>
                      {item.mediaType === 'video' ? 'Ver video' : 'Ampliar'}
                    </span>
                  </button>
                </div>

                <div className="studio-card-body">
                  <div className="studio-card-meta">
                    <span className="studio-type-inline">
                      {item.mediaType === 'video' ? (
                        <Film size={13} strokeWidth={1.8} />
                      ) : (
                        <ImageIcon size={13} strokeWidth={1.8} />
                      )}
                      <span>
                        {item.mediaType === 'video'
                          ? 'Video Dron 4K'
                          : 'Fotografía'}
                      </span>
                    </span>
                    <span aria-hidden="true">·</span>
                    <span className="capitalize">{item.sector}</span>
                  </div>
                  <h3 className="studio-card-title">{item.title}</h3>
                  {item.subtitle && (
                    <p className="studio-card-sub">{item.subtitle}</p>
                  )}

                  {isAdmin && !isSystemArchive && (
                    <button
                      type="button"
                      className="studio-delete-btn"
                      onClick={() => void handleDeleteAsset(item.id)}
                      aria-label={`Eliminar ${item.title}`}
                    >
                      <Trash2 size={14} strokeWidth={1.8} />
                      <span>Eliminar</span>
                    </button>
                  )}
                </div>
              </article>
            );
          })}
        </div>
      </div>

      {activeLightboxItem && (
        <div
          className="media-lightbox-backdrop"
          role="dialog"
          aria-modal="true"
          aria-label={activeLightboxItem.title}
          onClick={() => setLightboxIndex(null)}
        >
          <div
            className="media-lightbox-dialog"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="media-lightbox-header">
              <div>
                <span className="media-lightbox-meta">
                  {activeLightboxItem.mediaType === 'video'
                    ? 'Video Dron 4K'
                    : 'Fotografía Aérea / Campo'}{' '}
                  · {activeLightboxItem.sector}
                </span>
                <h3 className="media-lightbox-title">
                  {activeLightboxItem.title}
                </h3>
              </div>

              <button
                type="button"
                className="icon-btn lightbox-close-btn"
                aria-label="Cerrar visor"
                onClick={() => setLightboxIndex(null)}
              >
                <X size={20} strokeWidth={1.8} />
              </button>
            </div>

            <div className="media-lightbox-stage">
              {activeLightboxItem.mediaType === 'video' ? (
                getYoutubeEmbedUrl(activeLightboxItem.url) ? (
                  <iframe
                    src={getYoutubeEmbedUrl(activeLightboxItem.url)!}
                    title={activeLightboxItem.title}
                    className="media-lightbox-asset"
                    allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                    allowFullScreen
                  />
                ) : (
                  <video
                    key={activeLightboxItem.id}
                    src={activeLightboxItem.url}
                    poster={activeLightboxItem.poster}
                    controls
                    autoPlay
                    playsInline
                    preload="metadata"
                    className="media-lightbox-asset"
                  />
                )
              ) : (
                <img
                  src={activeLightboxItem.url}
                  alt={activeLightboxItem.title}
                  referrerPolicy="no-referrer"
                  className="media-lightbox-asset"
                />
              )}
            </div>

            <div className="media-lightbox-footer">
              <p className="media-lightbox-sub">
                {activeLightboxItem.subtitle}
              </p>
              <div className="media-lightbox-nav">
                <button
                  type="button"
                  className="btn btn-ghost btn-sm"
                  onClick={() =>
                    setLightboxIndex((prev) =>
                      prev === null
                        ? 0
                        : (prev - 1 + filteredItems.length) %
                          filteredItems.length
                    )
                  }
                >
                  <ChevronLeft size={16} />
                  <span>Anterior</span>
                </button>
                <span className="tabular-nums lightbox-counter">
                  {(lightboxIndex ?? 0) + 1} / {filteredItems.length}
                </span>
                <button
                  type="button"
                  className="btn btn-ghost btn-sm"
                  onClick={() =>
                    setLightboxIndex((prev) =>
                      prev === null ? 0 : (prev + 1) % filteredItems.length
                    )
                  }
                >
                  <span>Siguiente</span>
                  <ChevronRight size={16} />
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </section>
  );
}
