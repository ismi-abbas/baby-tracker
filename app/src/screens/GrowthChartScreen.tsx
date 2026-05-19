import React, { useState, useEffect } from 'react';
import { T, fonts } from '../tokens';
import { Card, Chip, TabBar, iconBtnStyle, useNav } from '../components/ui';
import { I } from '../components/Icons';
import { useBaby } from '../context/BabyContext';
import type { GrowthEntry } from '../types';

const WHO_MONTHS = [0,1,2,3,4,5,6,7,8,9,10,11,12];
const WHO_P3  = [2.5,3.4,4.4,5.1,5.6,6.1,6.4,6.7,7.0,7.2,7.5,7.7,7.9];
const WHO_P50 = [3.3,4.5,5.6,6.4,7.0,7.5,7.9,8.3,8.6,8.9,9.2,9.4,9.6];
const WHO_P97 = [4.4,5.8,7.1,8.0,8.7,9.3,9.8,10.2,10.6,10.9,11.2,11.5,11.8];

export function GrowthChartScreen() {
  const { baby, babyApi } = useBaby();
  const { nav } = useNav();
  const [entries, setEntries] = useState<GrowthEntry[]>([]);

  useEffect(() => {
    if (!baby) return;
    (babyApi.growth.list() as Promise<GrowthEntry[]>)
      .then(e => setEntries(e.slice().reverse()))
      .catch(() => {});
  }, [baby, babyApi]);

  const W = 320, H = 200;
  const wMin = 2, wMax = 12.5, xMin = 0, xMax = 12;

  function ageMonths(iso: string) {
    if (!baby?.birthDate) return 0;
    const d = new Date(iso);
    const b = new Date(baby.birthDate);
    return (d.getTime() - b.getTime()) / (1000 * 3600 * 24 * 30.44);
  }

  const px = (x: number) => 22 + ((x - xMin) / (xMax - xMin)) * (W - 30);
  const py = (y: number) => 12 + (1 - (y - wMin) / (wMax - wMin)) * (H - 28);
  const path = (arr: number[]) => arr.map((y, i) => `${i ? 'L' : 'M'} ${px(WHO_MONTHS[i])} ${py(y)}`).join(' ');

  const babyPoints = entries.map(e => {
    const x = ageMonths(e.measuredAt);
    const y = (e.weightG ?? 0) / 1000;
    return [x, y] as [number, number];
  }).filter(([x]) => x >= 0 && x <= 12);

  const latest = entries[entries.length - 1];
  const prev = entries[entries.length - 2];
  const weightKg = latest ? (latest.weightG ?? 0) / 1000 : 0;
  const delta = latest && prev ? ((latest.weightG ?? 0) - (prev.weightG ?? 0)) : null;
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
          {['Weight', 'Length', 'Head'].map((m, i) => (
            <div key={m} style={{ flex: 1, padding: '8px 10px', borderRadius: 11, textAlign: 'center', fontSize: 12, fontWeight: 700, background: i === 0 ? T.card : 'transparent', color: i === 0 ? T.rose : T.inkSoft, boxShadow: i === 0 ? '0 1px 2px rgba(0,0,0,0.04)' : 'none' }}>{m}</div>
          ))}
        </div>
      </div>

      <div style={{ padding: '14px 22px 0', display: 'flex', alignItems: 'flex-end', justifyContent: 'space-between' }}>
        <div>
          <div style={{ fontSize: 11, color: T.inkMute, fontWeight: 600, letterSpacing: 0.5, textTransform: 'uppercase' }}>Weight · latest</div>
          <div style={{ fontFamily: fonts.serif, fontSize: 44, color: T.ink, fontWeight: 500, lineHeight: 1, letterSpacing: -1, marginTop: 2 }}>
            {weightKg > 0 ? weightKg.toFixed(1) : '—'}<span style={{ fontSize: 16, color: T.inkMute, fontStyle: 'italic', marginLeft: 4 }}>kg</span>
          </div>
          {delta !== null && (
            <div style={{ display: 'inline-flex', alignItems: 'center', gap: 5, marginTop: 6, fontSize: 12, color: T.sage, fontWeight: 600 }}>
              ▲ {delta > 0 ? `+${delta}` : delta} g
            </div>
          )}
        </div>
        <Chip color={T.rose} soft={T.roseSoft} style={{ padding: '6px 12px', fontSize: 12.5 }}>~50th percentile</Chip>
      </div>

      <div style={{ padding: '14px 16px 0' }}>
        <Card pad={14}>
          <svg viewBox={`0 0 ${W} ${H}`} width="100%" height="180">
            {[3,5,7,9,11].map(v => (
              <g key={v}>
                <line x1="22" x2={W-8} y1={py(v)} y2={py(v)} stroke={T.rule} strokeDasharray="2 3"/>
                <text x="2" y={py(v)+3} fontFamily="JetBrains Mono" fontSize="8" fill={T.inkMute}>{v}</text>
              </g>
            ))}
            <path d={`${path(WHO_P3)} L ${px(xMax)} ${py(WHO_P97[12])} ${[...WHO_P97].reverse().map((y,i) => `L ${px(WHO_MONTHS[12-i])} ${py(y)}`).join(' ')} Z`} fill={T.roseSoft} opacity="0.45"/>
            <path d={path(WHO_P3)}  stroke={T.inkMute} strokeWidth="1" fill="none" strokeDasharray="3 4" opacity="0.5"/>
            <path d={path(WHO_P50)} stroke={T.rose}    strokeWidth="1.5" fill="none" opacity="0.6"/>
            <path d={path(WHO_P97)} stroke={T.inkMute} strokeWidth="1" fill="none" strokeDasharray="3 4" opacity="0.5"/>
            {babyPoints.length > 1 && (
              <path d={babyPoints.map(([x,y],i) => `${i?'L':'M'} ${px(x)} ${py(y)}`).join(' ')}
                stroke={T.terracotta} strokeWidth="2.5" fill="none" strokeLinecap="round" strokeLinejoin="round"/>
            )}
            {babyPoints.map(([x,y],i) => (
              <circle key={i} cx={px(x)} cy={py(y)} r="5" fill={T.card} stroke={T.terracotta} strokeWidth="2"/>
            ))}
            {babyPoints.length > 0 && (() => {
              const last = babyPoints[babyPoints.length-1];
              return (
                <>
                  <circle cx={px(last[0])} cy={py(last[1])} r="9" fill="none" stroke={T.terracotta} strokeWidth="1" opacity="0.4"/>
                  <g transform={`translate(${px(last[0])+8},${py(last[1])-18})`}>
                    <rect x="0" y="0" width="68" height="22" rx="6" fill={T.terracotta}/>
                    <text x="6" y="14" fontFamily="Hanken Grotesk" fontWeight="700" fontSize="10" fill={T.card}>
                      {babyName} · {weightKg.toFixed(1)}
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
            <span><span style={{ display: 'inline-block', width: 10, height: 2, background: T.terracotta, verticalAlign: 'middle', marginRight: 4 }}/> {babyName}</span>
            <span><span style={{ display: 'inline-block', width: 10, height: 2, background: T.rose, verticalAlign: 'middle', marginRight: 4 }}/> WHO 50th</span>
            <span><span style={{ display: 'inline-block', width: 10, height: 1, borderTop: `1px dashed ${T.inkMute}`, verticalAlign: 'middle', marginRight: 4 }}/> 3rd / 97th</span>
          </div>
        </Card>
      </div>

      <div style={{ padding: '14px 16px 0' }}>
        <div style={{ fontSize: 11, fontWeight: 700, color: T.inkMute, letterSpacing: 0.6, textTransform: 'uppercase', padding: '0 6px 8px' }}>History</div>
        <Card pad={0}>
          {history.length === 0 ? (
            <div style={{ padding: '20px 14px', textAlign: 'center', color: T.inkMute, fontSize: 13 }}>No measurements yet</div>
          ) : history.map((e, i) => {
            const kg = (e.weightG ?? 0) / 1000;
            const prevEntry = history[i+1];
            const diff = prevEntry ? (e.weightG ?? 0) - (prevEntry.weightG ?? 0) : null;
            return (
              <div key={e.id} style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '12px 14px', borderTop: i ? `1px solid ${T.rule}` : 'none' }}>
                <div style={{ fontSize: 12.5, color: T.inkSoft, flex: 1 }}>
                  {new Date(e.measuredAt).toLocaleDateString([], { month: 'short', day: 'numeric' })}
                  {e.visitType === 'doctor' ? ' · Dr. visit' : ''}
                </div>
                <div style={{ fontFamily: fonts.serif, fontSize: 16, color: T.ink, fontWeight: 500 }}>{kg.toFixed(2)} kg</div>
                <div style={{ width: 60, textAlign: 'right', fontSize: 11.5, fontWeight: 600, color: diff !== null && diff > 0 ? T.sage : T.inkMute }}>
                  {diff !== null ? `+${diff}g` : '—'}
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
