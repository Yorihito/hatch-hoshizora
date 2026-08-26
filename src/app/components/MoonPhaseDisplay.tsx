'use client';

interface Props {
  phase: number;       // 0-1
  illumination: number; // 0-1
  phaseName: string;
}

export default function MoonPhaseDisplay({ phase, illumination, phaseName }: Props) {
  const SIZE = 60;
  const r = SIZE / 2;

  // SVG で月の満ち欠けを描画
  const percent = Math.round(illumination * 100);

  // 月齢 (0-29.5日)
  const age = Math.round(phase * 29.5 * 10) / 10;

  // SVGパスで月の満ち欠けを描く
  const cx = r;
  const cy = r;
  const mr = r - 2;

  // 位相に応じた描画
  // phase: 0=新月, 0.25=上弦, 0.5=満月, 0.75=下弦
  let svgContent: string;

  if (phase < 0.03 || phase > 0.97) {
    // 新月 (暗い円)
    svgContent = `<circle cx="${cx}" cy="${cy}" r="${mr}" fill="#222" stroke="#555" stroke-width="1"/>`;
  } else if (phase >= 0.47 && phase <= 0.53) {
    // 満月
    svgContent = `<circle cx="${cx}" cy="${cy}" r="${mr}" fill="#ddd8b8" stroke="#aaa" stroke-width="1"/>`;
  } else {
    // 半月〜三日月など
    // cosEl: +1=新月, 0=上弦/下弦, -1=満月
    const cosEl = Math.cos(phase * 2 * Math.PI);
    const waxing = phase < 0.5;

    if (waxing) {
      // 右半円が明るい
      // 内側の楕円幅: cosEl が 1→0 のとき右側が細く, 0→-1 のとき満月へ
      const ellipseRx = Math.abs(cosEl) * mr;
      if (cosEl > 0.01) {
        // 三日月〜上弦: 右半円から暗い楕円を引く
        svgContent = `
          <circle cx="${cx}" cy="${cy}" r="${mr}" fill="#222" stroke="#444" stroke-width="1"/>
          <path d="M ${cx} ${cy - mr} A ${mr} ${mr} 0 0 1 ${cx} ${cy + mr} A ${ellipseRx} ${mr} 0 0 0 ${cx} ${cy - mr}" fill="#ddd8b8"/>
        `;
      } else {
        // 上弦〜満月直前: 右半円 + 左側に明るい楕円
        svgContent = `
          <circle cx="${cx}" cy="${cy}" r="${mr}" fill="#222" stroke="#444" stroke-width="1"/>
          <path d="M ${cx} ${cy - mr} A ${mr} ${mr} 0 0 1 ${cx} ${cy + mr} A ${mr} ${mr} 0 0 1 ${cx} ${cy - mr}" fill="#ddd8b8"/>
          <path d="M ${cx} ${cy - mr} A ${ellipseRx} ${mr} 0 0 0 ${cx} ${cy + mr} A ${mr} ${mr} 0 0 0 ${cx} ${cy - mr}" fill="#ddd8b8"/>
        `;
      }
    } else {
      // 左半円が明るい
      const ellipseRx = Math.abs(cosEl) * mr;
      if (cosEl < -0.01) {
        // 満月直後〜下弦: 左半円 + 右側に明るい楕円
        svgContent = `
          <circle cx="${cx}" cy="${cy}" r="${mr}" fill="#222" stroke="#444" stroke-width="1"/>
          <path d="M ${cx} ${cy - mr} A ${mr} ${mr} 0 0 0 ${cx} ${cy + mr} A ${mr} ${mr} 0 0 0 ${cx} ${cy - mr}" fill="#ddd8b8"/>
          <path d="M ${cx} ${cy - mr} A ${ellipseRx} ${mr} 0 0 1 ${cx} ${cy + mr} A ${mr} ${mr} 0 0 1 ${cx} ${cy - mr}" fill="#ddd8b8"/>
        `;
      } else {
        // 下弦〜有明月: 左半円から暗い楕円を引く
        svgContent = `
          <circle cx="${cx}" cy="${cy}" r="${mr}" fill="#222" stroke="#444" stroke-width="1"/>
          <path d="M ${cx} ${cy - mr} A ${mr} ${mr} 0 0 0 ${cx} ${cy + mr} A ${ellipseRx} ${mr} 0 0 1 ${cx} ${cy - mr}" fill="#ddd8b8"/>
        `;
      }
    }
  }

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
