'use client';

import { useState, useMemo } from 'react';
import dynamic from 'next/dynamic';
import MoonPhaseDisplay from './components/MoonPhaseDisplay';
import { julianDay, moonInfo } from './lib/astronomy';

// SSR 無効 (Canvas はブラウザのみ)
const StarMap = dynamic(() => import('./components/StarMap'), { ssr: false });

// 主要都市プリセット
const LOCATIONS = [
  { label: '東京', lat: 35.68, lon: 139.69 },
  { label: '大阪', lat: 34.69, lon: 135.50 },
  { label: '札幌', lat: 43.06, lon: 141.35 },
  { label: '那覇', lat: 26.21, lon: 127.68 },
  { label: 'ニューヨーク', lat: 40.71, lon: -74.01 },
  { label: 'ロンドン', lat: 51.51, lon: -0.13 },
  { label: 'シドニー', lat: -33.87, lon: 151.21 },
];

function formatDatetimeLocal(d: Date): string {
  const pad = (n: number) => String(n).padStart(2, '0');
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
}

export default function StarMapApp() {
  const [lat, setLat] = useState(35.68);
  const [lon, setLon] = useState(139.69);
  const [locationLabel, setLocationLabel] = useState('東京');
  const [datetime, setDatetime] = useState(() => formatDatetimeLocal(new Date()));
  const [showConstellations, setShowConstellations] = useState(true);
  const [showPlanets, setShowPlanets] = useState(true);
  const [showMoon, setShowMoon] = useState(true);
  const [showLabels, setShowLabels] = useState(true);

  const date = useMemo(() => new Date(datetime), [datetime]);

  const moon = useMemo(() => {
    const jd = julianDay(date);
    return moonInfo(jd);
  }, [date]);

  function handleLocation(e: React.ChangeEvent<HTMLSelectElement>) {
    const val = e.target.value;
    setLocationLabel(val);
    const found = LOCATIONS.find((l) => l.label === val);
    if (found) {
      setLat(found.lat);
      setLon(found.lon);
    }
  }

  function handleGeolocate() {
    if (!navigator.geolocation) return;
    navigator.geolocation.getCurrentPosition((pos) => {
      setLat(pos.coords.latitude);
      setLon(pos.coords.longitude);
      setLocationLabel('現在地');
    });
  }

  return (
    <div style={{ minHeight: '100vh', background: '#050d18', color: '#cde', fontFamily: 'sans-serif' }}>
      <header style={{ textAlign: 'center', padding: '1.5rem 1rem 0.5rem' }}>
        <h1 style={{ margin: 0, fontSize: '1.6rem', color: '#9be' }}>🌟 星空マップ</h1>
        <p style={{ margin: '0.3rem 0 0', color: '#668', fontSize: '0.85rem' }}>
          指定した場所・日時の星空をシミュレーション
        </p>
      </header>

      {/* コントロール */}
      <div style={{
        display: 'flex', flexWrap: 'wrap', gap: '0.8rem',
        justifyContent: 'center', padding: '1rem',
        background: '#0a1628', borderBottom: '1px solid #1a2a3a',
      }}>
        {/* 場所 */}
        <label style={{ display: 'flex', flexDirection: 'column', gap: 4, fontSize: 13 }}>
          <span style={{ color: '#8ab' }}>場所</span>
          <select
            value={locationLabel}
            onChange={handleLocation}
            style={{ background: '#0e1e30', color: '#cde', border: '1px solid #2a4a6a', borderRadius: 4, padding: '4px 8px' }}
          >
            {LOCATIONS.map((l) => (
              <option key={l.label} value={l.label}>{l.label}</option>
            ))}
            {locationLabel === '現在地' && <option value="現在地">現在地</option>}
          </select>
        </label>

        <label style={{ display: 'flex', flexDirection: 'column', gap: 4, fontSize: 13 }}>
          <span style={{ color: '#8ab' }}>緯度</span>
          <input
            type="number"
            value={lat}
            step={0.1}
            min={-90}
            max={90}
            onChange={(e) => setLat(parseFloat(e.target.value))}
            style={{ width: 80, background: '#0e1e30', color: '#cde', border: '1px solid #2a4a6a', borderRadius: 4, padding: '4px 8px' }}
          />
        </label>

        <label style={{ display: 'flex', flexDirection: 'column', gap: 4, fontSize: 13 }}>
          <span style={{ color: '#8ab' }}>経度</span>
          <input
            type="number"
            value={lon}
            step={0.1}
            min={-180}
            max={180}
            onChange={(e) => setLon(parseFloat(e.target.value))}
            style={{ width: 80, background: '#0e1e30', color: '#cde', border: '1px solid #2a4a6a', borderRadius: 4, padding: '4px 8px' }}
          />
        </label>

        <button
          onClick={handleGeolocate}
          style={{
            alignSelf: 'flex-end', background: '#1a3a5a', color: '#9be',
            border: '1px solid #2a5a8a', borderRadius: 4, padding: '5px 10px', cursor: 'pointer', fontSize: 13,
          }}
        >
          📍 現在地を使う
        </button>

        <label style={{ display: 'flex', flexDirection: 'column', gap: 4, fontSize: 13 }}>
          <span style={{ color: '#8ab' }}>日時</span>
          <input
            type="datetime-local"
            value={datetime}
            onChange={(e) => setDatetime(e.target.value)}
            style={{ background: '#0e1e30', color: '#cde', border: '1px solid #2a4a6a', borderRadius: 4, padding: '4px 8px' }}
          />
        </label>

        <button
          onClick={() => setDatetime(formatDatetimeLocal(new Date()))}
          style={{
            alignSelf: 'flex-end', background: '#1a3a5a', color: '#9be',
            border: '1px solid #2a5a8a', borderRadius: 4, padding: '5px 10px', cursor: 'pointer', fontSize: 13,
          }}
        >
          🕐 現在時刻
        </button>
      </div>

      {/* 表示切替 */}
      <div style={{ display: 'flex', gap: '1.2rem', justifyContent: 'center', padding: '0.7rem', flexWrap: 'wrap' }}>
        {[
          { label: '星座', value: showConstellations, set: setShowConstellations },
          { label: '惑星', value: showPlanets, set: setShowPlanets },
          { label: '月', value: showMoon, set: setShowMoon },
          { label: 'ラベル', value: showLabels, set: setShowLabels },
        ].map(({ label, value, set }) => (
          <label key={label} style={{ display: 'flex', alignItems: 'center', gap: 6, cursor: 'pointer', fontSize: 13, color: '#9be' }}>
            <input
              type="checkbox"
              checked={value}
              onChange={(e) => set(e.target.checked)}
              style={{ accentColor: '#4a8aff' }}
            />
            {label}
          </label>
        ))}
      </div>

      {/* 星空キャンバス */}
      <div style={{ padding: '0.5rem 1rem 1rem' }}>
        <StarMap
          lat={lat}
          lon={lon}
          date={date}
          showConstellations={showConstellations}
          showPlanets={showPlanets}
          showMoon={showMoon}
          showLabels={showLabels}
        />
      </div>

      {/* 月情報 */}
      {showMoon && (
        <div style={{
          maxWidth: 400, margin: '0 auto 1.5rem',
          background: '#0a1628', border: '1px solid #1a2a3a',
          borderRadius: 8, padding: '1rem',
        }}>
          <div style={{ color: '#8ab', fontSize: 12, marginBottom: 8 }}>月の状態</div>
          <MoonPhaseDisplay
            phase={moon.phase}
            illumination={moon.illumination}
            phaseName={moon.phaseName}
          />
        </div>
      )}

      {/* 凡例 */}
      <div style={{
        maxWidth: 700, margin: '0 auto 2rem',
        background: '#0a1628', border: '1px solid #1a2a3a',
        borderRadius: 8, padding: '1rem', fontSize: 12, color: '#668',
      }}>
        <div style={{ color: '#8ab', marginBottom: 6 }}>使い方</div>
        <ul style={{ margin: 0, paddingLeft: 16, lineHeight: 1.8 }}>
          <li>円の中心が天頂（真上）、円周が地平線です（地平線から天頂まで表示）</li>
          <li>北が上・南が下・東が右・西が左（上から空を見下ろすイメージ）</li>
          <li>星の大きさは明るさを表します（大きいほど明るい）</li>
          <li>青い線は星座の結線です</li>
        </ul>
      </div>
    </div>
  );
}
