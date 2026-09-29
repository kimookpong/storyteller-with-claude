import {C} from '../theme/tokens';

/** บทบาทสีเชิงความหมาย: asset ตัวเดียววาดได้ทั้ง vector (Kurzgesagt) และ collage (Vox) */
export type Pal = {
  style: 'vector' | 'collage';
  ink: string; // เส้น/รายละเอียดเข้ม
  stroke: number; // ความหนาเส้น (vector = 0)
  base: string; // พื้นผิวสว่าง (ผ้า, ถ้วย, ผนัง)
  mid: string;
  shade: string;
  deep: string; // เงาเข้มสุด
  coffee: string;
  coffeeLight: string;
  skin: string;
  skinShade: string;
  green: string;
  greenDark: string;
  red: string;
  gold: string;
  sky1: string;
  sky2: string;
  sea: string;
  seaDark: string;
  glow: string;
  accent: string;
};

export const VECTOR: Pal = {
  style: 'vector',
  ink: '#10213A',
  stroke: 0,
  base: '#F4F1EA',
  mid: '#C9D3E6',
  shade: '#5B7299',
  deep: '#22385C',
  coffee: '#6B3E26',
  coffeeLight: '#A86B45',
  skin: '#F2B38F',
  skinShade: '#D98C68',
  green: '#3FD6A0',
  greenDark: '#1E9C78',
  red: '#FF5A4A',
  gold: C.accent2,
  sky1: '#16284A',
  sky2: '#3C5A8C',
  sea: '#2E7FC0',
  seaDark: '#1C4F85',
  glow: '#FFE6A6',
  accent: C.accent1,
};

export const COLLAGE: Pal = {
  style: 'collage',
  ink: '#2A1E14',
  stroke: 3,
  base: '#F2E8D5',
  mid: '#DCCBAA',
  shade: '#A88D66',
  deep: '#5E4A33',
  coffee: '#5A3A22',
  coffeeLight: '#8C6440',
  skin: '#E6C9A5',
  skinShade: '#C4A07A',
  green: '#8FA66B',
  greenDark: '#5E7345',
  red: '#C8442F',
  gold: '#D9A441',
  sky1: '#CDB894',
  sky2: '#EADCBF',
  sea: '#8FA7A3',
  seaDark: '#617A77',
  glow: '#F7E7B9',
  accent: C.marker,
};

export const palFor = (style: 'vector' | 'collage' = 'vector') => (style === 'collage' ? COLLAGE : VECTOR);

/** props เส้นสำหรับ collage (vector ไม่มีเส้น) */
export const sk = (p: Pal, w = 1) => (p.stroke ? {stroke: p.ink, strokeWidth: p.stroke * w, strokeLinejoin: 'round' as const, strokeLinecap: 'round' as const} : {});
