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
  } else if (phase > 0.47 && phase < 0.53) {
    // 満月
    svgContent = `<circle cx="${cx}" cy="${cy}" r="${mr}" fill="#ddd8b8" stroke="#aaa" stroke-width="1"/>`;
  } else {
    // 半月〜三日月など
    const wax = phase < 0.5; // 満ちていく
    const t = wax ? phase * 2 : (phase - 0.5) * 2;
    const xOffset = mr * Math.cos(Math.PI * (1 - t));

    const rightArc = `M ${cx} ${cy - mr} A ${mr} ${mr} 0 0 1 ${cx} ${cy + mr}`;
    const innerArc = wax
      ? `A ${Math.abs(xOffset)} ${mr} 0 0 0 ${cx} ${cy - mr}`
      : `A ${Math.abs(xOffset)} ${mr} 0 0 1 ${cx} ${cy - mr}`;

    svgContent = `
      <circle cx="${cx}" cy="${cy}" r="${mr}" fill="#222" stroke="#444" stroke-width="1"/>
      <path d="${rightArc} ${innerArc}" fill="#ddd8b8"/>
    `;
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
