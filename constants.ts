
import { BannerDimensions } from './types';

export const ACCEPTED_FORMATS = ['image/png', 'image/jpeg', 'image/webp'];

export const BRANDS = [
  'anhanguera',
  'unopar',
  'pitagoras',
  'unime',
  'unic',
  'uniderp'
];

export const VALID_DIMENSIONS: BannerDimensions[] = [
  // SVG Patterns (mapped from PDF) - Mantendo dimensões pois banners podem ser exportados como bitmap nessas medidas
  { width: 1440, height: 260, label: 'Banner Principal Desktop (SVG)', format: 'SVG' },
  { width: 390, height: 200, label: 'Banner Principal Mobile (SVG)', format: 'SVG' },
  { width: 1366, height: 104, label: 'Strip Banner Desktop (SVG)', format: 'SVG' },
  { width: 351, height: 145, label: 'Strip Banner Mobile (SVG)', format: 'SVG' },
  
  // WEBP/Other Patterns (mapped from PDF)
  { width: 1920, height: 347, label: 'Banner Principal Desktop (WEBP)', format: 'WEBP' },
  { width: 640, height: 328, label: 'Banner Principal Mobile (WEBP)', format: 'WEBP' },
  { width: 1920, height: 146, label: 'Strip Banner Desktop (WEBP)', format: 'WEBP' },
  { width: 640, height: 264, label: 'Strip Banner Mobile (WEBP)', format: 'WEBP' },

  // User examples provided in prompt
  { width: 1920, height: 400, label: 'Banner Padrão Adicional 1', format: 'ANY' },
  { width: 360, height: 200, label: 'Banner Padrão Adicional 2', format: 'ANY' },
];
