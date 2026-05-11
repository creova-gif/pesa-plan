import React from 'react';
import {
  Google, Apple, Netflix, Spotify, Stripe,
  UberLight, Airbnb, Meta, Instagram, Youtube, Whatsapp, Shopify,
} from 'svgl-react';

type BrandEntry = {
  keywords: string[];
  component: React.ComponentType<React.SVGProps<SVGSVGElement>>;
  bg: string;
};

const BRANDS: BrandEntry[] = [
  { keywords: ['netflix'], component: Netflix, bg: '#141414' },
  { keywords: ['spotify'], component: Spotify, bg: '#1DB954' },
  { keywords: ['youtube', 'yt'], component: Youtube, bg: '#FF0000' },
  { keywords: ['whatsapp'], component: Whatsapp, bg: '#25D366' },
  { keywords: ['instagram', 'insta'], component: Instagram, bg: 'linear-gradient(135deg,#f09433,#e6683c,#dc2743,#cc2366,#bc1888)' },
  { keywords: ['facebook', 'meta', 'fb'], component: Meta, bg: '#1877F2' },
  { keywords: ['google', 'gmail', 'google pay', 'gpay'], component: Google, bg: '#fff' },
  { keywords: ['apple', 'icloud', 'app store', 'itunes'], component: Apple, bg: '#000' },
  { keywords: ['airbnb'], component: Airbnb, bg: '#FF5A5F' },
  { keywords: ['uber', 'bolt'], component: UberLight, bg: '#000' },
  { keywords: ['shopify'], component: Shopify, bg: '#96BF48' },
  { keywords: ['stripe'], component: Stripe, bg: '#6772e5' },
];

function detectBrand(text: string): BrandEntry | null {
  const lower = text.toLowerCase();
  for (const brand of BRANDS) {
    if (brand.keywords.some(k => lower.includes(k))) return brand;
  }
  return null;
}

export function getBrandEntry(category: string, notes?: string): BrandEntry | null {
  if (notes) {
    const match = detectBrand(notes);
    if (match) return match;
  }
  return detectBrand(category);
}

interface BrandIconProps {
  category: string;
  notes?: string;
  fallback: React.ReactNode;
  size?: number;
}

export function BrandIcon({ category, notes, fallback, size = 40 }: BrandIconProps) {
  const brand = getBrandEntry(category, notes);
  if (!brand) return <>{fallback}</>;

  const Icon = brand.component;
  const isGradient = brand.bg.startsWith('linear-gradient');

  return (
    <div
      style={{
        width: size,
        height: size,
        borderRadius: '50%',
        background: isGradient ? brand.bg : brand.bg,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        flexShrink: 0,
        overflow: 'hidden',
      }}
    >
      <Icon width={size * 0.55} height={size * 0.55} />
    </div>
  );
}
