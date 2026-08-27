/**
 * 天文計算ライブラリ
 * 簡易的なアルゴリズムで星・惑星・月の位置を計算します。
 */

export interface Equatorial {
  ra: number;  // 赤経 (度)
  dec: number; // 赤緯 (度)
}

export interface Horizontal {
  az: number;  // 方位角 (度, 北=0, 東=90)
  alt: number; // 高度 (度)
}

/** ユリウス日を計算 */
export function julianDay(date: Date): number {
  const Y = date.getUTCFullYear();
  const M = date.getUTCMonth() + 1;
  const D =
    date.getUTCDate() +
    date.getUTCHours() / 24 +
    date.getUTCMinutes() / 1440 +
    date.getUTCSeconds() / 86400;
  let A = Math.floor(Y / 100);
  let B = 2 - A + Math.floor(A / 4);
  if (M <= 2) {
    return Math.floor(365.25 * (Y - 1 + 4716)) + Math.floor(30.6001 * (M + 13)) + D + B - 1524.5;
  }
  return Math.floor(365.25 * (Y + 4716)) + Math.floor(30.6001 * (M + 1)) + D + B - 1524.5;
}

/** グリニッジ恒星時 (度) */
export function greenwichSiderealTime(jd: number): number {
  const T = (jd - 2451545.0) / 36525;
  let gst = 280.46061837 + 360.98564736629 * (jd - 2451545.0) + 0.000387933 * T * T - (T * T * T) / 38710000;
  return ((gst % 360) + 360) % 360;
}

/** 地方恒星時 (度) */
export function localSiderealTime(jd: number, lon: number): number {
  return ((greenwichSiderealTime(jd) + lon) % 360 + 360) % 360;
}

/** 赤道座標 → 地平座標変換 */
export function equatorialToHorizontal(eq: Equatorial, lat: number, lst: number): Horizontal {
  const ra = eq.ra;
  const dec = eq.dec;
  const ha = ((lst - ra) % 360 + 360) % 360; // 時角
  const latR = (lat * Math.PI) / 180;
  const decR = (dec * Math.PI) / 180;
  const haR = (ha * Math.PI) / 180;
  const sinAlt = Math.sin(decR) * Math.sin(latR) + Math.cos(decR) * Math.cos(latR) * Math.cos(haR);
  const alt = (Math.asin(sinAlt) * 180) / Math.PI;
  const cosAz = (Math.sin(decR) - Math.sin(latR) * sinAlt) / (Math.cos(latR) * Math.cos((alt * Math.PI) / 180));
  let az = (Math.acos(Math.max(-1, Math.min(1, cosAz))) * 180) / Math.PI;
  if (Math.sin(haR) > 0) az = 360 - az;
  return { az, alt };
}

// ────────────────────────────────────────────────
// 月
// ────────────────────────────────────────────────

export interface MoonInfo {
  ra: number;
  dec: number;
  phase: number; // 0=新月 0.5=満月 1=次の新月
  illumination: number; // 0-1
  phaseName: string;
}

export function moonInfo(jd: number): MoonInfo {
  const T = (jd - 2451545.0) / 36525;

  // 月の平均黄経
  let Lm = 218.3164477 + 481267.88123421 * T;
  // 太陽の平均黄経
  let Ls = 280.46646 + 36000.76983 * T;
  // 月の平均近点角
  let M = 357.52911 + 35999.05029 * T;
  // 月の平均近点角
  let Mm = 134.9634114 + 477198.8676313 * T;
  // 月の昇交点引数
  let F = 93.272095 + 483202.0175273 * T;
  // 月の離角
  let D = 297.8501921 + 445267.1114034 * T;

  Lm = ((Lm % 360) + 360) % 360;
  Ls = ((Ls % 360) + 360) % 360;
  M = ((M % 360) + 360) % 360;
  Mm = ((Mm % 360) + 360) % 360;
  F = ((F % 360) + 360) % 360;
  D = ((D % 360) + 360) % 360;

  const toR = Math.PI / 180;

  // 月の黄経摂動
  let dLon =
    6.289 * Math.sin(Mm * toR) +
    1.274 * Math.sin((2 * D - Mm) * toR) +
    0.658 * Math.sin(2 * D * toR) -
    0.186 * Math.sin(M * toR) -
    0.059 * Math.sin((2 * D - 2 * Mm) * toR) -
    0.057 * Math.sin((2 * D - M - Mm) * toR) +
    0.053 * Math.sin((2 * D + Mm) * toR) +
    0.046 * Math.sin((2 * D - M) * toR) +
    0.041 * Math.sin((Mm - M) * toR) -
    0.035 * Math.sin(D * toR) -
    0.031 * Math.sin((Mm + M) * toR) -
    0.015 * Math.sin((2 * F - 2 * D) * toR) +
    0.011 * Math.sin((Mm - 4 * D) * toR);

  // 月の黄緯摂動
  let dLat =
    5.128 * Math.sin(F * toR) +
    0.281 * Math.sin((Mm + F) * toR) -
    0.28 * Math.sin((Mm - F) * toR) -
    0.173 * Math.sin((F - 2 * D) * toR) -
    0.055 * Math.sin((Mm - F - 2 * D) * toR) -
    0.046 * Math.sin((Mm + F - 2 * D) * toR);

  const moonLon = Lm + dLon;
  const moonLat = dLat;

  // 黄道座標 → 赤道座標
  const eps = 23.439291 - 0.013004 * T; // 黄道傾斜角
  const epsR = eps * toR;
  const lonR = moonLon * toR;
  const latR = moonLat * toR;

  const ra = (Math.atan2(Math.sin(lonR) * Math.cos(epsR) - Math.tan(latR) * Math.sin(epsR), Math.cos(lonR)) * 180) / Math.PI;
  const dec = (Math.asin(Math.sin(latR) * Math.cos(epsR) + Math.cos(latR) * Math.sin(epsR) * Math.sin(lonR)) * 180) / Math.PI;

  // 月齢・位相
  const elongation = ((moonLon - Ls) % 360 + 360) % 360;
  const phase = elongation / 360;
  const illumination = (1 - Math.cos(elongation * toR)) / 2;

  const phaseNames = ['新月', '三日月', '上弦', '十三夜月', '満月', '居待月', '下弦', '有明月'];
  const phaseName = phaseNames[Math.round(phase * 8) % 8];

  return {
    ra: ((ra % 360) + 360) % 360,
    dec,
    phase,
    illumination,
    phaseName,
  };
}

// ────────────────────────────────────────────────
// 太陽
// ────────────────────────────────────────────────

export interface SunInfo {
  ra: number;
  dec: number;
  lon: number; // 黄経
}

export function sunInfo(jd: number): SunInfo {
  const T = (jd - 2451545.0) / 36525;
  const L0 = 280.46646 + 36000.76983 * T;
  const M = ((357.52911 + 35999.05029 * T) % 360 + 360) % 360;
  const toR = Math.PI / 180;
  const C = (1.914602 - 0.004817 * T) * Math.sin(M * toR) + 0.019993 * Math.sin(2 * M * toR) + 0.000289 * Math.sin(3 * M * toR);
  const lon = ((L0 + C) % 360 + 360) % 360;
  const eps = 23.439291 - 0.013004 * T;
  const lonR = lon * toR;
  const epsR = eps * toR;
  const ra = ((Math.atan2(Math.cos(epsR) * Math.sin(lonR), Math.cos(lonR)) * 180) / Math.PI + 360) % 360;
  const dec = (Math.asin(Math.sin(epsR) * Math.sin(lonR)) * 180) / Math.PI;
  return { ra, dec, lon };
}

// ────────────────────────────────────────────────
// 惑星 (簡易 VSOP87 近似)
// ────────────────────────────────────────────────

export interface PlanetInfo {
  name: string;
  nameJa: string;
  ra: number;
  dec: number;
  mag: number;
  color: string;
}

function planetElements(jd: number): PlanetInfo[] {
  const T = (jd - 2451545.0) / 36525;
  const toR = Math.PI / 180;
  const eps = 23.439291 - 0.013004 * T;
  const epsR = eps * toR;

  function eclipticToRaDec(lon: number, lat: number): { ra: number; dec: number } {
    const lonR = lon * toR;
    const latR = lat * toR;
    const ra = ((Math.atan2(Math.sin(lonR) * Math.cos(epsR) - Math.tan(latR) * Math.sin(epsR), Math.cos(lonR)) * 180) / Math.PI + 360) % 360;
    const dec = (Math.asin(Math.sin(latR) * Math.cos(epsR) + Math.cos(latR) * Math.sin(epsR) * Math.sin(lonR)) * 180) / Math.PI;
    return { ra, dec };
  }

  // 各惑星の軌道要素（簡易値）
  const planets: { name: string; nameJa: string; L: number; dL: number; mag: number; color: string }[] = [
    { name: 'Mercury', nameJa: '水星', L: 252.251 + 149474.074 * T, dL: 0, mag: -0.5, color: '#aaa' },
    { name: 'Venus', nameJa: '金星', L: 181.98 + 58519.213 * T, dL: 0, mag: -4.0, color: '#ffe8a0' },
    { name: 'Mars', nameJa: '火星', L: 355.433 + 19141.696 * T, dL: 0, mag: -1.5, color: '#ff6040' },
    { name: 'Jupiter', nameJa: '木星', L: 34.396 + 3036.301 * T, dL: 0, mag: -2.5, color: '#e8d0a0' },
    { name: 'Saturn', nameJa: '土星', L: 50.077 + 1223.011 * T, dL: 0, mag: 0.5, color: '#d4b870' },
  ];

  return planets.map((p) => {
    const lon = ((p.L % 360) + 360) % 360;
    const { ra, dec } = eclipticToRaDec(lon, 0);
    return { name: p.name, nameJa: p.nameJa, ra, dec, mag: p.mag, color: p.color };
  });
}

export { planetElements };

// ────────────────────────────────────────────────
// 恒星カタログ (明るい星 + 主要星座)
// ────────────────────────────────────────────────

export interface Star {
  name?: string;
  nameJa?: string;
  ra: number;  // 赤経 (度)
  dec: number; // 赤緯 (度)
  mag: number; // 実視等級
}

export interface ConstellationLine {
  nameJa: string;
  lines: [number, number][]; // インデックスペア
  stars: Star[];
}

// 明るい恒星 (等級 4 前後まで含む代表的な星)
export const STARS: Star[] = [
  // おおいぬ座
  { name: 'Sirius', nameJa: 'シリウス', ra: 101.287, dec: -16.716, mag: -1.46 },
  { name: 'Adhara', ra: 104.656, dec: -28.972, mag: 1.50 },
  // こいぬ座
  { name: 'Procyon', nameJa: 'プロキオン', ra: 114.825, dec: 5.225, mag: 0.34 },
  // オリオン座
  { name: 'Rigel', nameJa: 'リゲル', ra: 78.634, dec: -8.201, mag: 0.12 },
  { name: 'Betelgeuse', nameJa: 'ベテルギウス', ra: 88.793, dec: 7.407, mag: 0.50 },
  { name: 'Bellatrix', ra: 81.283, dec: 6.35, mag: 1.64 },
  { name: 'Alnilam', ra: 84.053, dec: -1.202, mag: 1.70 },
  { name: 'Alnitak', ra: 85.190, dec: -1.943, mag: 1.74 },
  { name: 'Mintaka', ra: 83.002, dec: -0.299, mag: 2.23 },
  { name: 'Saiph', ra: 86.939, dec: -9.670, mag: 2.07 },
  // ふたご座
  { name: 'Pollux', nameJa: 'ポルックス', ra: 116.329, dec: 28.026, mag: 1.14 },
  { name: 'Castor', nameJa: 'カストル', ra: 113.650, dec: 31.888, mag: 1.58 },
  // おうし座
  { name: 'Aldebaran', nameJa: 'アルデバラン', ra: 68.980, dec: 16.509, mag: 0.85 },
  { name: 'Elnath', ra: 81.573, dec: 28.608, mag: 1.65 },
  // ぎょしゃ座
  { name: 'Capella', nameJa: 'カペラ', ra: 79.172, dec: 45.998, mag: 0.08 },
  { name: 'Menkalinan', ra: 89.882, dec: 44.947, mag: 1.90 },
  // しし座
  { name: 'Regulus', nameJa: 'レグルス', ra: 152.093, dec: 11.967, mag: 1.35 },
  { name: 'Denebola', ra: 177.265, dec: 14.572, mag: 2.14 },
  { name: 'Algieba', ra: 154.993, dec: 19.841, mag: 2.08 },
  // おとめ座
  { name: 'Spica', nameJa: 'スピカ', ra: 201.298, dec: -11.161, mag: 0.97 },
  // うしかい座
  { name: 'Arcturus', nameJa: 'アルクトゥルス', ra: 213.915, dec: 19.182, mag: -0.04 },
  // かんむり座
  { name: 'Alphecca', ra: 233.672, dec: 26.715, mag: 2.23 },
  // さそり座
  { name: 'Antares', nameJa: 'アンタレス', ra: 247.352, dec: -26.432, mag: 0.96 },
  { name: 'Shaula', ra: 263.402, dec: -37.103, mag: 1.62 },
  // てんびん座
  { name: 'Zubenelgenubi', ra: 222.720, dec: -16.042, mag: 2.75 },
  // へびつかい座
  { name: 'Rasalhague', ra: 263.734, dec: 12.560, mag: 2.08 },
  // わし座
  { name: 'Altair', nameJa: 'アルタイル', ra: 297.696, dec: 8.868, mag: 0.77 },
  // こと座
  { name: 'Vega', nameJa: 'ベガ', ra: 279.234, dec: 38.783, mag: 0.03 },
  // はくちょう座
  { name: 'Deneb', nameJa: 'デネブ', ra: 310.358, dec: 45.280, mag: 1.25 },
  { name: 'Sadr', ra: 305.557, dec: 40.257, mag: 2.23 },
  { name: 'Gienah Cyg', ra: 318.234, dec: 33.970, mag: 2.48 },
  { name: 'Delta Cyg', ra: 296.244, dec: 45.131, mag: 2.87 },
  // みなみのさかな座
  { name: 'Fomalhaut', nameJa: 'フォーマルハウト', ra: 344.413, dec: -29.622, mag: 1.16 },
  // ペガスス座
  { name: 'Markab', ra: 346.190, dec: 15.205, mag: 2.49 },
  { name: 'Scheat', ra: 345.944, dec: 28.083, mag: 2.44 },
  { name: 'Algenib', ra: 3.309, dec: 15.183, mag: 2.83 },
  { name: 'Alpheratz', ra: 2.097, dec: 29.090, mag: 2.07 },
  // アンドロメダ座
  { name: 'Mirach', ra: 17.433, dec: 35.621, mag: 2.07 },
  { name: 'Almach', ra: 30.975, dec: 42.330, mag: 2.10 },
  // ケフェウス座
  { name: 'Alderamin', ra: 319.645, dec: 62.585, mag: 2.45 },
  // カシオペヤ座
  { name: 'Schedar', ra: 10.127, dec: 56.537, mag: 2.24 },
  { name: 'Caph', ra: 2.294, dec: 59.150, mag: 2.27 },
  { name: 'Gamma Cas', ra: 14.177, dec: 60.717, mag: 2.47 },
  { name: 'Delta Cas', ra: 21.454, dec: 60.235, mag: 2.68 },
  { name: 'Epsilon Cas', ra: 28.599, dec: 63.670, mag: 3.38 },
  // おおぐま座
  { name: 'Alioth', ra: 193.507, dec: 55.959, mag: 1.76 },
  { name: 'Dubhe', ra: 165.932, dec: 61.751, mag: 1.81 },
  { name: 'Alkaid', ra: 206.885, dec: 49.313, mag: 1.85 },
  { name: 'Mizar', ra: 200.981, dec: 54.925, mag: 2.04 },
  { name: 'Merak', ra: 165.460, dec: 56.383, mag: 2.34 },
  { name: 'Phecda', ra: 178.458, dec: 53.695, mag: 2.44 },
  { name: 'Megrez', ra: 183.857, dec: 57.033, mag: 3.31 },
  // こぐま座
  { name: 'Polaris', nameJa: '北極星', ra: 37.954, dec: 89.264, mag: 1.97 },
  { name: 'Kochab', ra: 222.676, dec: 74.155, mag: 2.08 },
  // りゅう座
  { name: 'Eltanin', ra: 269.152, dec: 51.489, mag: 2.24 },
  { name: 'Rastaban', ra: 262.608, dec: 52.301, mag: 2.79 },
  // ヘルクレス座
  { name: 'Kornephoros', ra: 247.555, dec: 21.490, mag: 2.77 },
  // ケンタウルス座
  { name: 'Rigil Kentaurus', ra: 219.902, dec: -60.834, mag: -0.27 },
  { name: 'Hadar', ra: 210.956, dec: -60.373, mag: 0.61 },
  // 南十字座
  { name: 'Acrux', ra: 186.650, dec: -63.099, mag: 0.77 },
  { name: 'Mimosa', ra: 191.930, dec: -59.688, mag: 1.25 },
  // エリダヌス座
  { name: 'Achernar', ra: 24.429, dec: -57.237, mag: 0.46 },
  // みずへび座
  { name: 'Canopus', nameJa: 'カノープス', ra: 95.988, dec: -52.696, mag: -0.72 },
  // ほ座
  { name: 'Suhail', ra: 136.999, dec: -43.433, mag: 2.21 },
  // りゅうこつ座
  { name: 'Miaplacidus', ra: 138.300, dec: -69.717, mag: 1.68 },
  // くじゃく座
  { name: 'Peacock', ra: 306.412, dec: -56.735, mag: 1.94 },
  // グルース座
  { name: 'Alnair', ra: 332.058, dec: -46.961, mag: 1.74 },
  // つる座
  { name: 'Tiaki', ra: 340.667, dec: -46.885, mag: 2.11 },
  // いて座
  { name: 'Kaus Australis', ra: 276.043, dec: -34.384, mag: 1.79 },
  { name: 'Nunki', ra: 283.817, dec: -26.297, mag: 2.02 },
  // やぎ座
  { name: 'Dabih', ra: 305.253, dec: -14.781, mag: 3.05 },
  // みずがめ座
  { name: 'Sadalsuud', ra: 322.890, dec: -5.571, mag: 2.91 },
  // うお座
  { name: 'Eta Psc', ra: 22.870, dec: 15.345, mag: 3.62 },
  // 追加の明るい恒星（表示密度向上）
  { name: 'Hamal', ra: 31.793, dec: 23.462, mag: 2.01 },
  { name: 'Mirfak', ra: 51.080, dec: 49.861, mag: 1.79 },
  { name: 'Algol', ra: 47.042, dec: 40.956, mag: 2.12 },
  { name: 'Menkar', ra: 45.570, dec: 4.089, mag: 2.54 },
  { name: 'Alhena', ra: 99.428, dec: 16.399, mag: 1.93 },
  { name: 'Mirzam', ra: 95.675, dec: -17.956, mag: 1.98 },
  { name: 'Wezen', ra: 107.097, dec: -26.393, mag: 1.83 },
  { name: 'Naos', ra: 120.896, dec: -40.004, mag: 2.25 },
  { name: 'Avior', ra: 125.628, dec: -59.509, mag: 1.86 },
  { name: 'Alphard', ra: 141.897, dec: -8.658, mag: 1.98 },
  { name: 'Diphda', ra: 10.897, dec: -17.986, mag: 2.04 },
  { name: 'Izar', ra: 221.246, dec: 27.074, mag: 2.35 },
  { name: 'Seginus', ra: 225.486, dec: 38.308, mag: 3.04 },
  { name: 'Rasalgethi', ra: 258.662, dec: 14.390, mag: 3.48 },
  { name: 'Enif', ra: 333.437, dec: 9.875, mag: 2.39 },
  { name: 'Sadalmelik', ra: 331.446, dec: -0.320, mag: 2.95 },
  { name: 'Atria', ra: 252.167, dec: -69.027, mag: 1.91 },
  { name: 'Gacrux', ra: 187.791, dec: -57.113, mag: 1.59 },
];

// 星座の定義 (STARS配列のインデックスで結ぶ線を定義)
// 各星座は stars: Star[] と lines: [i, j][] を持つ
// ここでは代表的な星座を定義

function starIndex(name: string): number {
  return STARS.findIndex((s) => s.name === name);
}

export const CONSTELLATIONS: ConstellationLine[] = [
  {
    nameJa: 'オリオン座',
    stars: STARS,
    lines: [
      [starIndex('Betelgeuse'), starIndex('Bellatrix')],
      [starIndex('Betelgeuse'), starIndex('Alnilam')],
      [starIndex('Bellatrix'), starIndex('Mintaka')],
      [starIndex('Mintaka'), starIndex('Alnilam')],
      [starIndex('Alnilam'), starIndex('Alnitak')],
      [starIndex('Mintaka'), starIndex('Rigel')],
      [starIndex('Alnitak'), starIndex('Saiph')],
      [starIndex('Rigel'), starIndex('Saiph')],
    ],
  },
  {
    nameJa: 'おおいぬ座',
    stars: STARS,
    lines: [
      [starIndex('Sirius'), starIndex('Adhara')],
    ],
  },
  {
    nameJa: 'ふたご座',
    stars: STARS,
    lines: [
      [starIndex('Castor'), starIndex('Pollux')],
    ],
  },
  {
    nameJa: 'おうし座',
    stars: STARS,
    lines: [
      [starIndex('Aldebaran'), starIndex('Elnath')],
    ],
  },
  {
    nameJa: 'ぎょしゃ座',
    stars: STARS,
    lines: [
      [starIndex('Capella'), starIndex('Menkalinan')],
      [starIndex('Menkalinan'), starIndex('Elnath')],
    ],
  },
  {
    nameJa: 'しし座',
    stars: STARS,
    lines: [
      [starIndex('Regulus'), starIndex('Algieba')],
      [starIndex('Algieba'), starIndex('Denebola')],
    ],
  },
  {
    nameJa: 'さそり座',
    stars: STARS,
    lines: [
      [starIndex('Antares'), starIndex('Shaula')],
    ],
  },
  {
    nameJa: 'はくちょう座',
    stars: STARS,
    lines: [
      [starIndex('Deneb'), starIndex('Sadr')],
      [starIndex('Sadr'), starIndex('Altair')],
      [starIndex('Sadr'), starIndex('Gienah Cyg')],
      [starIndex('Sadr'), starIndex('Delta Cyg')],
    ],
  },
  {
    nameJa: 'おおぐま座',
    stars: STARS,
    lines: [
      [starIndex('Dubhe'), starIndex('Merak')],
      [starIndex('Merak'), starIndex('Phecda')],
      [starIndex('Phecda'), starIndex('Megrez')],
      [starIndex('Megrez'), starIndex('Alioth')],
      [starIndex('Alioth'), starIndex('Mizar')],
      [starIndex('Mizar'), starIndex('Alkaid')],
      [starIndex('Megrez'), starIndex('Dubhe')],
    ],
  },
  {
    nameJa: 'カシオペヤ座',
    stars: STARS,
    lines: [
      [starIndex('Caph'), starIndex('Schedar')],
      [starIndex('Schedar'), starIndex('Gamma Cas')],
      [starIndex('Gamma Cas'), starIndex('Delta Cas')],
      [starIndex('Delta Cas'), starIndex('Epsilon Cas')],
    ],
  },
  {
    nameJa: 'こと座',
    stars: STARS,
    lines: [
      [starIndex('Vega'), starIndex('Alphecca')],
    ],
  },
  {
    nameJa: 'ペガスス座',
    stars: STARS,
    lines: [
      [starIndex('Markab'), starIndex('Scheat')],
      [starIndex('Scheat'), starIndex('Alpheratz')],
      [starIndex('Alpheratz'), starIndex('Algenib')],
      [starIndex('Algenib'), starIndex('Markab')],
    ],
  },
];
