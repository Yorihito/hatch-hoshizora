'use client';

import { useEffect, useRef, useCallback } from 'react';
import {
  julianDay,
  localSiderealTime,
  equatorialToHorizontal,
  moonInfo,
  sunInfo,
  planetElements,
  STARS,
  CONSTELLATIONS,
} from '../lib/astronomy';

interface Props {
  lat: number;
  lon: number;
  date: Date;
  showConstellations: boolean;
  showPlanets: boolean;
  showMoon: boolean;
  showLabels: boolean;
}

// 方位角・高度 → キャンバス座標 (ステレオ投影)
// 北が上、東が右 (上空から見下ろす向き)
function toCanvas(az: number, alt: number, cx: number, cy: number, r: number): [number, number] | null {
  if (alt < 0) return null; // 地平線以下
  const rho = r * (1 - alt / 90); // 天頂から外側へ
  const azR = (az * Math.PI) / 180;
  const x = cx + rho * Math.sin(azR);
  const y = cy - rho * Math.cos(azR);
  return [x, y];
}

function magToRadius(mag: number): number {
  // 等級 → 半径 (明るいほど大きい)
  return Math.max(0.45, (4.5 - mag * 0.8) * 0.85);
}

export default function StarMap({ lat, lon, date, showConstellations, showPlanets, showMoon, showLabels }: Props) {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  const draw = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const W = canvas.clientWidth || canvas.width;
    const H = canvas.clientHeight || canvas.height;
    const cx = W / 2;
    const cy = H / 2;
    const r = Math.min(W, H) / 2 - 20;

    // 背景
    ctx.fillStyle = '#000d1a';
    ctx.fillRect(0, 0, W, H);

    // 天球ドーム (円)
    ctx.save();
    ctx.beginPath();
    ctx.arc(cx, cy, r, 0, Math.PI * 2);
    ctx.strokeStyle = '#334';
    ctx.lineWidth = 2;
    ctx.stroke();
    ctx.clip();

    const jd = julianDay(date);
    const lst = localSiderealTime(jd, lon);

    // 方位目盛り
    const dirs = [
      { az: 0, label: '北', color: '#4af' },
      { az: 90, label: '東', color: '#e0c060' },
      { az: 180, label: '南', color: '#e0c060' },
      { az: 270, label: '西', color: '#e0c060' },
    ];
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    for (const d of dirs) {
      // 方位線
      const pos = toCanvas(d.az, 0, cx, cy, r);
      if (pos) {
        const [x, y] = pos;
        ctx.beginPath();
        ctx.moveTo(cx, cy);
        ctx.lineTo(x, y);
        ctx.strokeStyle = 'rgba(80,120,160,0.25)';
        ctx.lineWidth = 1;
        ctx.stroke();

        // 地平線上の目盛りマーク
        const azR = (d.az * Math.PI) / 180;
        const tickLen = 10;
        const tx1 = cx + (r - tickLen) * Math.sin(azR);
        const ty1 = cy - (r - tickLen) * Math.cos(azR);
        ctx.beginPath();
        ctx.moveTo(tx1, ty1);
        ctx.lineTo(x, y);
        ctx.strokeStyle = d.color;
        ctx.lineWidth = 2;
        ctx.stroke();
      }
    }

    // 高度サークル (30, 60 度)
    for (const alt of [30, 60]) {
      const pr = r * (1 - alt / 90);
      ctx.beginPath();
      ctx.arc(cx, cy, pr, 0, Math.PI * 2);
      ctx.strokeStyle = '#1a2535';
      ctx.lineWidth = 1;
      ctx.stroke();
    }

    // 星座線
    if (showConstellations) {
      ctx.lineWidth = 0.7;
      ctx.strokeStyle = 'rgba(80,140,255,0.35)';
      for (const cons of CONSTELLATIONS) {
        for (const [i, j] of cons.lines) {
          if (i < 0 || j < 0) continue;
          const a = cons.stars[i];
          const b = cons.stars[j];
          const ha = equatorialToHorizontal({ ra: a.ra, dec: a.dec }, lat, lst);
          const hb = equatorialToHorizontal({ ra: b.ra, dec: b.dec }, lat, lst);
          const pa = toCanvas(ha.az, ha.alt, cx, cy, r);
          const pb = toCanvas(hb.az, hb.alt, cx, cy, r);
          if (pa && pb) {
            ctx.beginPath();
            ctx.moveTo(pa[0], pa[1]);
            ctx.lineTo(pb[0], pb[1]);
            ctx.stroke();
          }
        }
      }

      // 星座名ラベル
      if (showLabels) {
        ctx.font = '11px sans-serif';
        ctx.fillStyle = 'rgba(80,140,255,0.6)';
        ctx.textAlign = 'center';
        for (const cons of CONSTELLATIONS) {
          // 中心を星の平均位置で求める
          let sumAz = 0, sumAlt = 0, cnt = 0;
          const seen = new Set<number>();
          for (const [i, j] of cons.lines) {
            for (const idx of [i, j]) {
              if (idx < 0 || seen.has(idx)) continue;
              seen.add(idx);
              const s = cons.stars[idx];
              const h = equatorialToHorizontal({ ra: s.ra, dec: s.dec }, lat, lst);
              if (h.alt > 0) { sumAz += h.az; sumAlt += h.alt; cnt++; }
            }
          }
          if (cnt > 0) {
            const p = toCanvas(sumAz / cnt, sumAlt / cnt, cx, cy, r);
            if (p) ctx.fillText(cons.nameJa, p[0], p[1] - 8);
          }
        }
      }
    }

    // 恒星
    for (const star of STARS) {
      if (star.mag > 4.5) continue;
      const h = equatorialToHorizontal({ ra: star.ra, dec: star.dec }, lat, lst);
      const pos = toCanvas(h.az, h.alt, cx, cy, r);
      if (!pos) continue;
      const [x, y] = pos;
      const sr = magToRadius(star.mag);

      // グロー
      if (star.mag < 1.5) {
        const grad = ctx.createRadialGradient(x, y, 0, x, y, sr * 3);
        grad.addColorStop(0, 'rgba(255,255,255,0.6)');
        grad.addColorStop(1, 'rgba(255,255,255,0)');
        ctx.beginPath();
        ctx.arc(x, y, sr * 3, 0, Math.PI * 2);
        ctx.fillStyle = grad;
        ctx.fill();
      }
      ctx.beginPath();
      ctx.arc(x, y, sr, 0, Math.PI * 2);
      ctx.fillStyle = '#ffffff';
      ctx.fill();

      if (showLabels && star.nameJa && star.mag < 1.5) {
        ctx.font = '10px sans-serif';
        ctx.fillStyle = 'rgba(200,220,255,0.8)';
        ctx.textAlign = 'left';
        ctx.fillText(star.nameJa, x + sr + 2, y - 2);
      }
    }

    // 惑星
    if (showPlanets) {
      const planets = planetElements(jd);
      for (const p of planets) {
        const h = equatorialToHorizontal({ ra: p.ra, dec: p.dec }, lat, lst);
        const pos = toCanvas(h.az, h.alt, cx, cy, r);
        if (!pos) continue;
        const [x, y] = pos;
        const sr = magToRadius(p.mag) + 1;

        const grad = ctx.createRadialGradient(x, y, 0, x, y, sr * 2.5);
        grad.addColorStop(0, p.color);
        grad.addColorStop(1, 'rgba(0,0,0,0)');
        ctx.beginPath();
        ctx.arc(x, y, sr * 2.5, 0, Math.PI * 2);
        ctx.fillStyle = grad;
        ctx.fill();

        ctx.beginPath();
        ctx.arc(x, y, sr, 0, Math.PI * 2);
        ctx.fillStyle = p.color;
        ctx.fill();

        if (showLabels) {
          ctx.font = '10px sans-serif';
          ctx.fillStyle = p.color;
          ctx.textAlign = 'left';
          ctx.fillText(p.nameJa, x + sr + 2, y - 2);
        }
      }
    }

    // 月
    if (showMoon) {
      const moon = moonInfo(jd);
      const h = equatorialToHorizontal({ ra: moon.ra, dec: moon.dec }, lat, lst);
      const pos = toCanvas(h.az, h.alt, cx, cy, r);
      if (pos) {
        const [x, y] = pos;
        const mr = 9;

        // グロー
        const grad = ctx.createRadialGradient(x, y, 0, x, y, mr * 3);
        grad.addColorStop(0, 'rgba(200,200,180,0.5)');
        grad.addColorStop(1, 'rgba(0,0,0,0)');
        ctx.beginPath();
        ctx.arc(x, y, mr * 3, 0, Math.PI * 2);
        ctx.fillStyle = grad;
        ctx.fill();

        // 月の本体
        ctx.beginPath();
        ctx.arc(x, y, mr, 0, Math.PI * 2);
        ctx.fillStyle = '#ddd8b8';
        ctx.fill();

        // 月の欠け (正しいアルゴリズム)
        // phase: 0=新月, 0.5=満月, 1=新月
        const phase = moon.phase;
        if (phase < 0.02 || phase > 0.98) {
          // 新月: 暗い
          ctx.beginPath();
          ctx.arc(x, y, mr, 0, Math.PI * 2);
          ctx.fillStyle = '#222';
          ctx.fill();
        } else if (phase >= 0.02 && phase <= 0.98) {
          ctx.save();
          ctx.beginPath();
          ctx.arc(x, y, mr, 0, Math.PI * 2);
          ctx.clip();

          // 暗い背景
          ctx.fillStyle = '#111';
          ctx.fillRect(x - mr, y - mr, mr * 2, mr * 2);

          const waxing = phase <= 0.5;
          // cos(elongation): +1=新月, 0=上弦/下弦, -1=満月
          const cosEl = Math.cos(phase * 2 * Math.PI);

          ctx.fillStyle = '#ddd8b8';
          if (waxing) {
            // 右半円を明るく
            ctx.beginPath();
            ctx.arc(x, y, mr, -Math.PI / 2, Math.PI / 2);
            ctx.closePath();
            ctx.fill();
            if (cosEl > 0.01) {
              // 右半分に暗い楕円を重ねて三日月に
              ctx.fillStyle = '#111';
              ctx.beginPath();
              ctx.ellipse(x, y, cosEl * mr, mr, 0, -Math.PI / 2, Math.PI / 2);
              ctx.closePath();
              ctx.fill();
            } else if (cosEl < -0.01) {
              // 左半分にも明るい楕円を追加 (十三夜月など)
              ctx.beginPath();
              ctx.ellipse(x, y, -cosEl * mr, mr, 0, Math.PI / 2, 3 * Math.PI / 2);
              ctx.closePath();
              ctx.fill();
            }
          } else {
            // 左半円を明るく
            ctx.beginPath();
            ctx.arc(x, y, mr, Math.PI / 2, 3 * Math.PI / 2);
            ctx.closePath();
            ctx.fill();
            if (cosEl < -0.01) {
              // 右半分にも明るい楕円を追加
              ctx.beginPath();
              ctx.ellipse(x, y, -cosEl * mr, mr, 0, -Math.PI / 2, Math.PI / 2);
              ctx.closePath();
              ctx.fill();
            } else if (cosEl > 0.01) {
              // 左半分に暗い楕円を重ねて有明月に
              ctx.fillStyle = '#111';
              ctx.beginPath();
              ctx.ellipse(x, y, cosEl * mr, mr, 0, Math.PI / 2, 3 * Math.PI / 2);
              ctx.closePath();
              ctx.fill();
            }
          }
          ctx.restore();
        }

        if (showLabels) {
          ctx.font = '10px sans-serif';
          ctx.fillStyle = '#ddd8b8';
          ctx.textAlign = 'left';
          ctx.fillText(`月 (${moon.phaseName})`, x + mr + 2, y - 2);
        }
      }
    }

    ctx.restore();

    // 方位ラベル (円の外側、クリップ解除後に描画)
    ctx.font = 'bold 16px sans-serif';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    for (const d of dirs) {
      const azR = (d.az * Math.PI) / 180;
      const ix = cx + (r + 20) * Math.sin(azR);
      const iy = cy - (r + 20) * Math.cos(azR);
      ctx.fillStyle = d.color;
      ctx.fillText(d.label, ix, iy);
    }

    // 地平線ラベル
    ctx.font = '12px sans-serif';
    ctx.fillStyle = '#334';
    ctx.textAlign = 'center';
    ctx.fillText('地平線', cx, cy + r + 14);
  }, [lat, lon, date, showConstellations, showPlanets, showMoon, showLabels]);

  useEffect(() => {
    draw();
  }, [draw]);

  // キャンバスサイズ初期化 (マウント時のみ)
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const dpr = window.devicePixelRatio || 1;
    const size = Math.min(window.innerWidth, window.innerHeight, 700);
    canvas.style.width = size + 'px';
    canvas.style.height = size + 'px';
    canvas.width = size * dpr;
    canvas.height = size * dpr;
    const ctx = canvas.getContext('2d');
    if (ctx) ctx.scale(dpr, dpr);
    draw();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []); // マウント時のみ実行 (チェックボックス変更で縮まないよう)

  return (
    <canvas
      ref={canvasRef}
      style={{ display: 'block', margin: '0 auto', borderRadius: '50%', cursor: 'default' }}
    />
  );
}
