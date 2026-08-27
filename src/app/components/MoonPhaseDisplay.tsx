'use client';

interface Props {
  phase: number;       // 0-1
  illumination: number; // 0-1
  phaseName: string;
}

/**
 * SVGパスで月の満ち欠けを描画する
 *
 * アルゴリズム:
 *   - 月のディスクを描き、そのうえに明るい部分を正確なパスで重ねる
 *   - 明るい部分は「半円」と「楕円弧」の組み合わせで表現する
 *   - phase: 0=新月, 0.25=上弦, 0.5=満月, 0.75=下弦
 *   - 右半分が明るいとき (0 < phase < 0.5) は waxing (上弦へ)
 *   - 左半分が明るいとき (0.5 < phase < 1) は waning (下弦へ)
 *
 * 楕円ターミネーター幅: k = cos(phase * 2π)
 *   - phase=0  → k=+1 (細い三日月: 右端のみ)
 *   - phase=.25 → k=0  (右半円のみ)
 *   - phase=.5  → k=-1 (満月: 全体)
 *   - phase=.75 → k=0  (左半円のみ)
 */
function moonPath(phase: number, cx: number, cy: number, mr: number): string {
  if (phase < 0.02 || phase > 0.98) {
    // 新月: 暗い円のみ
    return `<circle cx="${cx}" cy="${cy}" r="${mr}" fill="#222" stroke="#555" stroke-width="1"/>`;
  }
  if (phase >= 0.48 && phase <= 0.52) {
    // 満月
    return `<circle cx="${cx}" cy="${cy}" r="${mr}" fill="#ddd8b8" stroke="#aaa" stroke-width="1"/>`;
  }

  const waxing = phase < 0.5;
  // k: ターミネーター楕円の幅係数
  // waxing 0→0.25: k +1→0 (三日月→上弦)
  // waxing 0.25→0.5: k 0→-1 (上弦→満月)
  const k = Math.cos(phase * 2 * Math.PI); // +1=新月, -1=満月

  const top = `${cx} ${cy - mr}`;
  const bot = `${cx} ${cy + mr}`;
  const ek = Math.abs(k) * mr; // 楕円のx半径

  let litPath: string;

  if (waxing) {
    if (k >= 0) {
      // 三日月 (右端の細い光): 右半円 → 暗い楕円で内側を塗り潰す
      // 右外弧 (sweep=1) + 楕円左弧 (sweep=0) で光る細い帯
      litPath = `M ${top} A ${mr} ${mr} 0 0 1 ${bot} A ${ek} ${mr} 0 0 0 ${top} Z`;
    } else {
      // 上弦〜満月 (右半円 + 左の楕円弧も光る)
      // 右半円全体 (sweep=1) + 楕円右弧 (sweep=1 で左側も追加)
      litPath =
        `M ${top} A ${mr} ${mr} 0 0 1 ${bot} A ${mr} ${mr} 0 0 1 ${top} Z ` +
        `M ${top} A ${ek} ${mr} 0 0 1 ${bot} A ${mr} ${mr} 0 0 0 ${top} Z`;
    }
  } else {
    if (k <= 0) {
      // 満月直後〜下弦 (左半円 + 右の楕円弧も光る)
      litPath =
        `M ${top} A ${mr} ${mr} 0 0 0 ${bot} A ${mr} ${mr} 0 0 0 ${top} Z ` +
        `M ${top} A ${ek} ${mr} 0 0 0 ${bot} A ${mr} ${mr} 0 0 1 ${top} Z`;
    } else {
      // 有明月 (左端の細い光): 左半円 → 暗い楕円で内側を塗り潰す
      litPath = `M ${top} A ${mr} ${mr} 0 0 0 ${bot} A ${ek} ${mr} 0 0 1 ${top} Z`;
    }
  }

  return `
    <circle cx="${cx}" cy="${cy}" r="${mr}" fill="#222" stroke="#444" stroke-width="1"/>
    <path d="${litPath}" fill="#ddd8b8"/>
  `;
}

export default function MoonPhaseDisplay({ phase, illumination, phaseName }: Props) {
  const SIZE = 60;
  const r = SIZE / 2;

  const percent = Math.round(illumination * 100);
  const age = Math.round(phase * 29.5 * 10) / 10;

  const cx = r;
  const cy = r;
  const mr = r - 2;

  const svgContent = moonPath(phase, cx, cy, mr);

  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
      <svg width={SIZE} height={SIZE} viewBox={`0 0 ${SIZE} ${SIZE}`} dangerouslySetInnerHTML={{ __html: svgContent }} />
      <div>
        <div style={{ fontWeight: 'bold', color: '#ddd8b8' }}>{phaseName}</div>
        <div style={{ fontSize: 12, color: '#aaa' }}>月齢 {age} 日・輝面比 {percent}%</div>
      </div>
    </div>
  );
}
