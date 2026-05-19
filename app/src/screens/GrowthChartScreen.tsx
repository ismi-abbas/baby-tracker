import React, { useState, useEffect } from 'react';
import { useNavigate } from '@tanstack/react-router';
import { T, fonts } from '../tokens';
import { Card, Chip, TabBar, iconBtnStyle, useNav } from '../components/ui';
import { I } from '../components/Icons';
import { useBaby } from '../context/BabyContext';
import { cmToDisplay, gramsToDisplay, type LengthUnit, type WeightUnit, useUnitPrefs } from '../units';
import type { GrowthEntry } from '../types';

type Metric = 'weight' | 'length' | 'head';

const WHO_MONTHS = [0,1,2,3,4,5,6,7,8,9,10,11,12];
const WHO_P3  = [2.5,3.4,4.4,5.1,5.6,6.1,6.4,6.7,7.0,7.2,7.5,7.7,7.9];
const WHO_P50 = [3.3,4.5,5.6,6.4,7.0,7.5,7.9,8.3,8.6,8.9,9.2,9.4,9.6];
const WHO_P97 = [4.4,5.8,7.1,8.0,8.7,9.3,9.8,10.2,10.6,10.9,11.2,11.5,11.8];

function growthConfig(metric: Metric, weightUnit: WeightUnit, lengthUnit: LengthUnit) {
  if (metric === 'weight') return {
    label: 'Weight', unit: weightUnit, color: T.rose,
    getVal: (e: GrowthEntry) => gramsToDisplay(e.weightG ?? 0, weightUnit),
    defaultMin: gramsToDisplay(2000, weightUnit), defaultMax: gramsToDisplay(12500, weightUnit),
    delta: (a: GrowthEntry, b: GrowthEntry) => {
      const diff = (a.weightG ?? 0) - (b.weightG ?? 0);
      const val = gramsToDisplay(Math.abs(diff), weightUnit).toFixed(weightUnit === 'lb' ? 1 : 2);
      return `${diff > 0 ? '+' : diff < 0 ? '-' : ''}${val}${weightUnit}`;
    },
  };
  const field = metric === 'length' ? 'lengthCm' : 'headCm';
  return {
    label: metric === 'length' ? 'Length' : 'Head', unit: lengthUnit, color: metric === 'length' ? T.sage : T.terracotta,
    getVal: (e: GrowthEntry) => cmToDisplay((e[field] as number | undefined) ?? 0, lengthUnit),
    defaultMin: cmToDisplay(metric === 'length' ? 40 : 25, lengthUnit), defaultMax: cmToDisplay(metric === 'length' ? 90 : 55, lengthUnit),
    delta: (a: GrowthEntry, b: GrowthEntry) => {
      const diff = ((a[field] as number | undefined) ?? 0) - ((b[field] as number | undefined) ?? 0);
      const val = cmToDisplay(Math.abs(diff), lengthUnit).toFixed(1);
      return `${diff > 0 ? '+' : diff < 0 ? '-' : ''}${val}${lengthUnit}`;
    },
  };
}

export function GrowthChartScreen() {
  const { baby, babyApi } = useBaby();
  const { prefs } = useUnitPrefs();
  const { nav } = useNav();
  const navigate = useNavigate();
  const [entries, setEntries] = useState<GrowthEntry[]>([]);
  const [metric, setMetric] = useState<Metric>('weight');

  useEffect(() => {
    if (!baby) return;
    (babyApi.growth.list() as Promise<GrowthEntry[]>)
      .then(e => setEntries(e.slice().reverse()))
      .catch(() => {});
  }, [baby, babyApi]);

  const cfg = growthConfig(metric, prefs.weightUnit, prefs.lengthUnit);
  const W = 320, H = 200;
  const xMin = 0, xMax = 12;

  const validVals = entries.map(cfg.getVal).filter(v => v > 0);
  const wMin = validVals.length ? Math.min(...validVals) * 0.92 : cfg.defaultMin;
  const wMax = validVals.length ? Math.max(...validVals) * 1.08 : cfg.defaultMax;

  function ageMonths(iso: string) {
    if (!baby?.birthDate) return 0;
    const d = new Date(iso);
    const b = new Date(baby.birthDate);
    return (d.getTime() - b.getTime()) / (1000 * 3600 * 24 * 30.44);
  }

  const px = (x: number) => 22 + ((x - xMin) / (xMax - xMin)) * (W - 30);
  const py = (y: number) => 12 + (1 - (y - wMin) / (wMax - wMin)) * (H - 28);
  const whoVal = (kg: number) => prefs.weightUnit === 'lb' ? gramsToDisplay(kg * 1000, 'lb') : kg;
  const whoPath = (arr: number[]) => arr.map((y, i) => `${i ? 'L' : 'M'} ${px(WHO_MONTHS[i])} ${py(whoVal(y))}`).join(' ');

  const babyPoints = entries.map(e => {
    const x = ageMonths(e.measuredAt);
    const y = cfg.getVal(e);
    return [x, y] as [number, number];
  }).filter(([x, y]) => x >= 0 && x <= 12 && y > 0);

  const latest = entries[entries.length - 1];
  const prev = entries[entries.length - 2];
  const latestVal = latest ? cfg.getVal(latest) : 0;
  const deltaStr = latest && prev ? cfg.delta(latest, prev) : null;
  const history = entries.slice().reverse().slice(0, 5);
  const babyName = baby?.name?.split(' ')[0] ?? '…';

  return (
    <div style={{ width: '100%', minHeight: '100%', background: T.cream, fontFamily: fonts.sans, display: 'flex', flexDirection: 'column', paddingTop: 'max(20px, env(safe-area-inset-top))', boxSizing: 'border-box' }}>
      <div style={{ padding: '6px 20px 0', display: 'flex', alignItems: 'center', gap: 10 }}>
        <div style={{ flex: 1 }}>
          <div style={{ color: T.inkMute, fontSize: 12, fontWeight: 600, letterSpacing: 0.5, textTransform: 'uppercase' }}>GROWTH</div>
        </div>
        <button onClick={() => nav('growth-entry')} style={iconBtnStyle}><div style={{ width: 18, height: 18, color: T.ink }}>{I.plus}</div></button>
      </div>

      <div style={{ padding: '12px 16px 0' }}>
        <div style={{ display: 'flex', padding: 4, borderRadius: 14, background: 'rgba(0,0,0,0.04)', gap: 2 }}>
          {(['weight', 'length', 'head'] as Metric[]).map((m) => {
            const active = metric === m;
            const mc = growthConfig(m, prefs.weightUnit, prefs.lengthUnit);
            return (
              <div key={m} onClick={() => setMetric(m)} style={{ flex: 1, padding: '8px 10px', borderRadius: 11, textAlign: 'center', fontSize: 12, fontWeight: 700, cursor: 'pointer', background: active ? T.card : 'transparent', color: active ? mc.color : T.inkSoft, boxShadow: active ? '0 1px 2px rgba(0,0,0,0.04)' : 'none', transition: 'all 0.15s' }}>{mc.label}</div>
            );
          })}
        </div>
      </div>

      <div style={{ padding: '14px 22px 0', display: 'flex', alignItems: 'flex-end', justifyContent: 'space-between' }}>
        <div>
          <div style={{ fontSize: 11, color: T.inkMute, fontWeight: 600, letterSpacing: 0.5, textTransform: 'uppercase' }}>{cfg.label} · latest</div>
          <div style={{ fontFamily: fonts.serif, fontSize: 44, color: T.ink, fontWeight: 500, lineHeight: 1, letterSpacing: -1, marginTop: 2 }}>
            {latestVal > 0 ? latestVal.toFixed(1) : '—'}<span style={{ fontSize: 16, color: T.inkMute, fontStyle: 'italic', marginLeft: 4 }}>{cfg.unit}</span>
          </div>
          {deltaStr !== null && (
            <div style={{ display: 'inline-flex', alignItems: 'center', gap: 5, marginTop: 6, fontSize: 12, color: T.sage, fontWeight: 600 }}>
              ▲ {deltaStr}
            </div>
          )}
        </div>
        {metric === 'weight' && <Chip color={T.rose} soft={T.roseSoft} style={{ padding: '6px 12px', fontSize: 12.5 }}>~50th percentile</Chip>}
      </div>

      <div style={{ padding: '14px 16px 0' }}>
        <Card pad={14}>
          <svg viewBox={`0 0 ${W} ${H}`} width="100%" height="180">
            {(() => {
              const gridVals = Array.from({ length: 4 }, (_, i) => wMin + ((wMax - wMin) / 4) * (i + 1));
              return gridVals.map(v => (
                <g key={v}>
                  <line x1="22" x2={W-8} y1={py(v)} y2={py(v)} stroke={T.rule} strokeDasharray="2 3"/>
                  <text x="2" y={py(v)+3} fontFamily="JetBrains Mono" fontSize="8" fill={T.inkMute}>{v.toFixed(metric === 'weight' ? 1 : 0)}</text>
                </g>
              ));
            })()}
            {metric === 'weight' && <>
              <path d={`${whoPath(WHO_P3)} L ${px(xMax)} ${py(whoVal(WHO_P97[12]))} ${[...WHO_P97].reverse().map((y,i) => `L ${px(WHO_MONTHS[12-i])} ${py(whoVal(y))}`).join(' ')} Z`} fill={T.roseSoft} opacity="0.45"/>
              <path d={whoPath(WHO_P3)}  stroke={T.inkMute} strokeWidth="1" fill="none" strokeDasharray="3 4" opacity="0.5"/>
              <path d={whoPath(WHO_P50)} stroke={T.rose}    strokeWidth="1.5" fill="none" opacity="0.6"/>
              <path d={whoPath(WHO_P97)} stroke={T.inkMute} strokeWidth="1" fill="none" strokeDasharray="3 4" opacity="0.5"/>
            </>}
            {babyPoints.length > 1 && (
              <path d={babyPoints.map(([x,y],i) => `${i?'L':'M'} ${px(x)} ${py(y)}`).join(' ')}
                stroke={cfg.color} strokeWidth="2.5" fill="none" strokeLinecap="round" strokeLinejoin="round"/>
            )}
            {babyPoints.map(([x,y],i) => (
              <circle key={i} cx={px(x)} cy={py(y)} r="5" fill={T.card} stroke={cfg.color} strokeWidth="2"/>
            ))}
            {babyPoints.length > 0 && (() => {
              const last = babyPoints[babyPoints.length-1];
              return (
                <>
                  <circle cx={px(last[0])} cy={py(last[1])} r="9" fill="none" stroke={cfg.color} strokeWidth="1" opacity="0.4"/>
                  <g transform={`translate(${px(last[0])+8},${py(last[1])-18})`}>
                    <rect x="0" y="0" width="72" height="22" rx="6" fill={cfg.color}/>
                    <text x="6" y="14" fontFamily="Hanken Grotesk" fontWeight="700" fontSize="10" fill={T.card}>
                      {babyName} · {last[1].toFixed(1)}
                    </text>
                  </g>
                </>
              );
            })()}
            {[0,3,6,9,12].map(x => (
              <text key={x} x={px(x)-4} y={H-2} fontFamily="JetBrains Mono" fontSize="8" fill={T.inkMute}>{x}m</text>
            ))}
          </svg>
          <div style={{ display: 'flex', gap: 12, marginTop: 8, fontSize: 10.5, color: T.inkMute, flexWrap: 'wrap' }}>
            <span><span style={{ display: 'inline-block', width: 10, height: 2, background: cfg.color, verticalAlign: 'middle', marginRight: 4 }}/> {babyName}</span>
            {metric === 'weight' && <>
              <span><span style={{ display: 'inline-block', width: 10, height: 2, background: T.rose, verticalAlign: 'middle', marginRight: 4 }}/> WHO 50th</span>
              <span><span style={{ display: 'inline-block', width: 10, height: 1, borderTop: `1px dashed ${T.inkMute}`, verticalAlign: 'middle', marginRight: 4 }}/> 3rd / 97th</span>
            </>}
          </div>
        </Card>
      </div>

      <div style={{ padding: '14px 16px 0' }}>
        <div style={{ fontSize: 11, fontWeight: 700, color: T.inkMute, letterSpacing: 0.6, textTransform: 'uppercase', padding: '0 6px 8px' }}>History</div>
        <Card pad={0}>
          {history.length === 0 ? (
            <div style={{ padding: '20px 14px', textAlign: 'center', color: T.inkMute, fontSize: 13 }}>No measurements yet</div>
          ) : history.map((e, i) => {
            const val = cfg.getVal(e);
            const prevEntry = history[i+1];
            const prevVal = prevEntry ? cfg.getVal(prevEntry) : null;
            const diffStr = prevVal !== null && val > 0 && prevVal > 0 ? cfg.delta(e, prevEntry!) : null;
            return (
              <div key={e.id} onClick={() => navigate({ to: '/log/growth-entry', search: { id: e.id } as never })} style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '12px 14px', borderTop: i ? `1px solid ${T.rule}` : 'none', cursor: 'pointer' }}>
                <div style={{ fontSize: 12.5, color: T.inkSoft, flex: 1 }}>
                  {new Date(e.measuredAt).toLocaleDateString([], { month: 'short', day: 'numeric' })}
                  {e.visitType === 'doctor' ? ' · Dr. visit' : ''}
                </div>
                <div style={{ fontFamily: fonts.serif, fontSize: 16, color: val > 0 ? T.ink : T.inkMute, fontWeight: 500 }}>{val > 0 ? val.toFixed(metric === 'weight' && prefs.weightUnit === 'kg' ? 2 : 1) : '—'} <span style={{ fontSize: 11, color: T.inkMute, fontStyle: 'italic' }}>{cfg.unit}</span></div>
                <div style={{ width: 64, textAlign: 'right', fontSize: 11.5, fontWeight: 600, color: diffStr ? T.sage : T.inkMute }}>
                  {diffStr ?? '—'}
                </div>
              </div>
            );
          })}
        </Card>
      </div>

      <TabBar />
    </div>
  );
}
