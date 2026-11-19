export type SectorId = 'izcuchaca' | 'zurite' | 'huarocondo';
export type ModalityId = 'terreno' | 'villa';
export type ArchiveCategory = 'drone-video' | 'panoramic' | 'orthophoto' | 'field';
export type AgentName = 'Alison Mariano' | 'José Luis';

export interface SectorInfo {
  id: SectorId;
  name: string;
  shortName: string;
  district: string;
  elevation: string;
  pricePerSqmUsd: number;
  dotColor: string;
  headline: string;
  description: string;
  coordinates: { lat: number; lng: number };
  image: string;
  alt: string;
}

export interface ShowcaseSlide {
  id: string;
  mediaType: 'image' | 'video';
  url: string;
  poster?: string;
  alt: string;
  title: string;
  subtitle: string;
  sector: SectorId | 'general';
}

export interface AreaOption {
  sqm: number;
  label: string;
  scale: number;
}

export interface ArchiveMediaItem {
  id: string;
  title: string;
  subtitle: string;
  mediaType: 'image' | 'video';
  url: string;
  poster?: string;
  category: ArchiveCategory;
  sector: SectorId | 'general';
  sortOrder: number;
}

export const REAL_ASSETS = {
  // Real DJI drone videos
  videoParcelFlight: '/assets/aistudio/DJI_20261020155700_0011_V_feba0087.MP4',
  videoChapelRidge: '/assets/aistudio/DJI_20261020160049_0012_V_b5418c9d.MP4',

  // Sweeping valley & hillside aerials
  valleyPanorama: '/assets/aistudio/DJI_20261029105718_0006_V_041336b7.JPG',
  hillsidePlots: '/assets/aistudio/DJI_20261029105857_0007_V_4c6757bf.JPG',

  // Top-down orthophoto lot surveys
  orthoFullBlock: '/assets/aistudio/DJI_20261020155511_0003_V_24dd19cf.JPG',
  orthoTerraceClose: '/assets/aistudio/DJI_20261020155529_0004_V_65b77cc2.JPG',
  orthoRoadCorridor: '/assets/aistudio/DJI_20261020155533_0005_V_de2f37ce.JPG',
  orthoEucalyptusEdge: '/assets/aistudio/DJI_20261020155558_0006_V_d882adab.JPG',
  orthoStepFields: '/assets/aistudio/DJI_20261020155622_0007_V_f442858c.JPG',
  orthoBorderAccess: '/assets/aistudio/DJI_20261020155628_0008_V_f40e4a68.JPG',
  orthoEastSurvey: '/assets/aistudio/DJI_20261020155651_0009_V_43f1751d.JPG',
  orthoSouthLine: '/assets/aistudio/DJI_20261020155654_0010_V_42fe52c0.JPG',

  // On-site landmark & field team photography
  chapelTeamWide: '/assets/aistudio/DJI_20261020160052_0013_V_cece8e8a.JPG',
  chapelTeamGreeting: '/assets/aistudio/DJI_20261020160108_0014_V_82510637.JPG',
};

export const SECTORS: Record<SectorId, SectorInfo> = {
  izcuchaca: {
    id: 'izcuchaca',
    name: 'Valle de Izcuchaca',
    shortName: 'Izcuchaca',
    district: 'Anta · Cusco',
    elevation: '3,345 m s.n.m.',
    pricePerSqmUsd: 115,
    dotColor: '#183E29',
    headline: 'Conectividad directa al corredor Cusco – Chinchero',
    description:
      'Lotes urbanos planos con acceso afirmado, bosques de eucalipto colindantes y vista panorámica hacia toda la Pampa de Anta.',
    coordinates: { lat: -13.4622, lng: -72.1489 },
    image: REAL_ASSETS.valleyPanorama,
    alt: 'Vista aérea real con dron del valle urbano y campiña de Izcuchaca en Anta, Cusco',
  },
  zurite: {
    id: 'zurite',
    name: 'Laderas de Zurite & Capilla',
    shortName: 'Zurite',
    district: 'Zurite · Anta',
    elevation: '3,405 m s.n.m.',
    pricePerSqmUsd: 92,
    dotColor: '#B86B43',
    headline: 'Horizonte agrícola, bosques y patrimonio local',
    description:
      'Estancias amplias junto a laderas arboladas y acceso directo desde la vía rural, ideales para casas quinta y proyectos eco-residenciales.',
    coordinates: { lat: -13.4525, lng: -72.2564 },
    image: REAL_ASSETS.chapelTeamGreeting,
    alt: 'Capilla andina de doble torre y equipo de campo de Realty Anta Terra rodeados de eucaliptos',
  },
  huarocondo: {
    id: 'huarocondo',
    name: 'Mirador Huarocondo',
    shortName: 'Huarocondo',
    district: 'Huarocondo · Anta',
    elevation: '3,365 m s.n.m.',
    pricePerSqmUsd: 84,
    dotColor: '#C49642',
    headline: 'Laderas soleadas con relieve natural y privacidad',
    description:
      'Parcelas en elevación natural con orientación solar privilegiada todo el año y proyección hacia el Valle Sagrado.',
    coordinates: { lat: -13.4165, lng: -72.201 },
    image: REAL_ASSETS.hillsidePlots,
    alt: 'Fotografía aérea de laderas cultivadas, parcelas elevadas y relieve en Anta, Cusco',
  },
};

export const AREA_OPTIONS: AreaOption[] = [
  { sqm: 350, label: '350 m²', scale: 0.96 },
  { sqm: 600, label: '600 m²', scale: 1.0 },
  { sqm: 1200, label: '1,200 m²', scale: 1.04 },
];

export const VILLA_BUILD_SURCHARGE_USD = 68000;

export const DEFAULT_SHOWCASE_SLIDES: ShowcaseSlide[] = [
  {
    id: 'real-showcase-1',
    mediaType: 'video',
    url: REAL_ASSETS.videoParcelFlight,
    poster: REAL_ASSETS.orthoFullBlock,
    alt: 'Sobrevuelo real con dron DJI sobre los lotes y parcelas delimitadas en Anta, Cusco',
    title: 'Sobrevuelo en Dron · Anta',
    subtitle: 'Toma aérea real sobre el polígono matriz, bosques de eucalipto y vía carrozable',
    sector: 'izcuchaca',
  },
  {
    id: 'real-showcase-2',
    mediaType: 'image',
    url: REAL_ASSETS.valleyPanorama,
    alt: 'Panorámica aérea completa de la ciudad de Anta, áreas verdes y tierras agrícolas',
    title: 'Pampa de Izcuchaca',
    subtitle: 'Expansión urbana ordenada a minutos del eje comercial de Anta y la vía a Cusco',
    sector: 'izcuchaca',
  },
  {
    id: 'real-showcase-3',
    mediaType: 'video',
    url: REAL_ASSETS.videoChapelRidge,
    poster: REAL_ASSETS.chapelTeamWide,
    alt: 'Vuelo de dron recorriendo la capilla andina y ladera de eucaliptos en Anta',
    title: 'Bosque y Ladera Andina',
    subtitle: 'Reconocimiento audiovisual directo en campo con topografía natural privilegiada',
    sector: 'zurite',
  },
  {
    id: 'real-showcase-4',
    mediaType: 'image',
    url: REAL_ASSETS.hillsidePlots,
    alt: 'Vista aérea de laderas, terrazas agrícolas y lotes en altura en Anta',
    title: 'Mirador del Valle',
    subtitle: 'Suelos fértiles, drenaje natural en pendiente suave y dominio visual de 360°',
    sector: 'huarocondo',
  },
];

export const REAL_ARCHIVE_ITEMS: ArchiveMediaItem[] = [
  {
    id: 'real-vid-1',
    title: 'Sobrevuelo Matriz del Terreno (Video 4K)',
    subtitle: 'Recorrido continuo con dron sobre polígono, eucaliptos y frente vial',
    mediaType: 'video',
    url: REAL_ASSETS.videoParcelFlight,
    poster: REAL_ASSETS.orthoFullBlock,
    category: 'drone-video',
    sector: 'izcuchaca',
    sortOrder: 1,
  },
  {
    id: 'real-vid-2',
    title: 'Vuelo Sector Capilla y Bosque (Video 4K)',
    subtitle: 'Aproximación aérea al hito arquitectónico y ladera forestada',
    mediaType: 'video',
    url: REAL_ASSETS.videoChapelRidge,
    poster: REAL_ASSETS.chapelTeamWide,
    category: 'drone-video',
    sector: 'zurite',
    sortOrder: 2,
  },
  {
    id: 'real-pano-1',
    title: 'Panorámica Urbana y Agrícola de Anta',
    subtitle: 'Conectividad total con la trama urbana, estadio y corredor Izcuchaca',
    mediaType: 'image',
    url: REAL_ASSETS.valleyPanorama,
    category: 'panoramic',
    sector: 'izcuchaca',
    sortOrder: 3,
  },
  {
    id: 'real-pano-2',
    title: 'Relieve y Laderas Mirador Illary',
    subtitle: 'Vista elevada de parcelas agrícolas y cordillera circundante',
    mediaType: 'image',
    url: REAL_ASSETS.hillsidePlots,
    category: 'panoramic',
    sector: 'huarocondo',
    sortOrder: 4,
  },
  {
    id: 'real-field-1',
    title: 'Visita de Reconocimiento en Campo',
    subtitle: 'Equipo Realty Anta Terra inspeccionando el acceso frente a la capilla',
    mediaType: 'image',
    url: REAL_ASSETS.chapelTeamGreeting,
    category: 'field',
    sector: 'zurite',
    sortOrder: 5,
  },
  {
    id: 'real-field-2',
    title: 'Hito Capilla y Ladera de Eucaliptos',
    subtitle: 'Entorno tranquilo rodeado de árboles maduros y aire puro',
    mediaType: 'image',
    url: REAL_ASSETS.chapelTeamWide,
    category: 'field',
    sector: 'zurite',
    sortOrder: 6,
  },
  {
    id: 'real-ortho-1',
    title: 'Ortofoto Matriz · Linderos Norte y Sur',
    subtitle: 'Captura cenital de parcelas delimitadas y sombra de arboleda',
    mediaType: 'image',
    url: REAL_ASSETS.orthoFullBlock,
    category: 'orthophoto',
    sector: 'izcuchaca',
    sortOrder: 7,
  },
  {
    id: 'real-ortho-2',
    title: 'Detalle Cenital · Terrazas y Lindero Este',
    subtitle: 'Subdivisión de paños planos con acceso directo a la vía vecinal',
    mediaType: 'image',
    url: REAL_ASSETS.orthoTerraceClose,
    category: 'orthophoto',
    sector: 'izcuchaca',
    sortOrder: 8,
  },
  {
    id: 'real-ortho-3',
    title: 'Corredor Vial y Frente de Lotes',
    subtitle: 'Vista perpendicular sobre la trocha carrozable consolidada',
    mediaType: 'image',
    url: REAL_ASSETS.orthoRoadCorridor,
    category: 'orthophoto',
    sector: 'izcuchaca',
    sortOrder: 9,
  },
  {
    id: 'real-ortho-4',
    title: 'Borde de Eucaliptos y Suelos Cultivados',
    subtitle: 'Cortina natural cortavientos bordeando las parcelas disponibles',
    mediaType: 'image',
    url: REAL_ASSETS.orthoEucalyptusEdge,
    category: 'orthophoto',
    sector: 'huarocondo',
    sortOrder: 10,
  },
  {
    id: 'real-ortho-5',
    title: 'Paños Verdes y Conexión de Barrio',
    subtitle: 'Transición armónica entre vivienda rural tradicional y lotes amplios',
    mediaType: 'image',
    url: REAL_ASSETS.orthoStepFields,
    category: 'orthophoto',
    sector: 'huarocondo',
    sortOrder: 11,
  },
  {
    id: 'real-ortho-6',
    title: 'Estudio Topográfico · Sector Sureste',
    subtitle: 'Medición visual de pendientes suaves y perímetros agrícolas',
    mediaType: 'image',
    url: REAL_ASSETS.orthoEastSurvey,
    category: 'orthophoto',
    sector: 'zurite',
    sortOrder: 12,
  },
  {
    id: 'real-ortho-7',
    title: 'Trazado Sur y Parcelación Orgánica',
    subtitle: 'Parcelas listas para diseño de casa quinta con cerco vivo',
    mediaType: 'image',
    url: REAL_ASSETS.orthoSouthLine,
    category: 'orthophoto',
    sector: 'zurite',
    sortOrder: 13,
  },
  {
    id: 'real-ortho-8',
    title: 'Frente Cercano a Viviendas Consolidadas',
    subtitle: 'Factibilidad inmediata por cercanía a redes del sector',
    mediaType: 'image',
    url: REAL_ASSETS.orthoBorderAccess,
    category: 'orthophoto',
    sector: 'izcuchaca',
    sortOrder: 14,
  },
];

export const ROUTE_ORIGINS = [
  {
    id: 'cusco',
    label: 'Plaza de Armas del Cusco',
    coords: { lat: -13.5167, lng: -71.9788 },
  },
  {
    id: 'chinchero',
    label: 'Corredor Chinchero',
    coords: { lat: -13.3917, lng: -72.0472 },
  },
];
