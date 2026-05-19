import React, { useState, useEffect } from 'react';
import { useNavigate } from '@tanstack/react-router';
import { T } from '../tokens';
import { Card, TabBar, useNav } from '../components/ui';
import { I } from '../components/Icons';
import { useBaby } from '../context/BabyContext';
import { cmToDisplay, gramsToDisplay, type LengthUnit, type WeightUnit, useUnitPrefs } from '../units';
import type { GrowthEntry } from '../types';
import { cn } from '../lib/utils';

type Metric = 'weight' | 'length' | 'head';

const WHO_MONTHS = [0,1,2,3,4,5,6,7,8,9,10,11,12];
const WHO_P3  = [2.5,3.4,4.4,5.1,5.6,6.1,6.4,6.7,7.0,7.2,7.5,7.7,7.9];
const WHO_P50 = [3.3,4.5,5.6,6.4,7.0,7.5,7.9,8.3,8.6,8.9,9.2,9.4,9.6];
const WHO_P97 = [4.4,5.8,7.1,8.0,8.7,9.3,9.8,10.2,10.6,10.9,11.2,11.5,11.8];

function growthConfig(metric: Metric, weightUnit: WeightUnit, lengthUnit: LengthUnit) {
  if (metric === 'weight') return {
    label: 'Weight', unit: weightUnit, color: T.rose, legendClass: 'bg-rose',
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
    label: metric === 'length' ? 'Length' : 'Head', unit: lengthUnit, color: metric === 'length' ? T.sage : T.terracotta, legendClass: metric === 'length' ? 'bg-sage' : 'bg-terracotta',
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
    <div className="box-border flex min-h-full w-full flex-col bg-cream pt-[max(20px,env(safe-area-inset-top))] font-sans">
      <div className="flex items-center gap-2.5 px-5 pt-1.5">
        <div className="flex-1">
          <div className="text-xs font-semibold uppercase tracking-[0.5px] text-ink-mute">GROWTH</div>
        </div>
        <button onClick={() => nav('growth-entry')} className="flex h-[38px] w-[38px] cursor-pointer items-center justify-center rounded-xl border-0 bg-black/4"><div className="h-[18px] w-[18px] text-ink">{I.plus}</div></button>
      </div>

      <div className="px-4 pt-3">
        <div className="flex gap-0.5 rounded-[14px] bg-black/4 p-1">
          {(['weight', 'length', 'head'] as Metric[]).map((m) => {
            const active = metric === m;
            const mc = growthConfig(m, prefs.weightUnit, prefs.lengthUnit);
            return (
              <div key={m} onClick={() => setMetric(m)} className={cn('flex-1 cursor-pointer rounded-[11px] px-2.5 py-2 text-center text-xs font-bold transition-all duration-150', active ? 'bg-card shadow-[0_1px_2px_rgba(0,0,0,0.04)]' : 'bg-transparent text-ink-soft', active && (mc.color === T.rose ? 'text-rose' : mc.color === T.sage ? 'text-sage' : 'text-terracotta'))}>{mc.label}</div>
            );
          })}
        </div>
      </div>

      <div className="flex items-end justify-between px-[22px] pt-3.5">
        <div>
          <div className="text-[11px] font-semibold uppercase tracking-[0.5px] text-ink-mute">{cfg.label} · latest</div>
          <div className="mt-0.5 font-serif text-[44px] font-medium leading-none tracking-[-1px] text-ink">
            {latestVal > 0 ? latestVal.toFixed(1) : '—'}<span className="ml-1 text-base italic text-ink-mute">{cfg.unit}</span>
          </div>
          {deltaStr !== null && (
            <div className="mt-1.5 inline-flex items-center gap-[5px] text-xs font-semibold text-sage">
              ▲ {deltaStr}
            </div>
          )}
        </div>
        {metric === 'weight' && <span className="inline-flex items-center gap-1.5 rounded-full bg-rose-soft px-3 py-1.5 font-sans text-[12.5px] font-semibold tracking-[0.2px] text-rose">~50th percentile</span>}
      </div>

      <div className="px-4 pt-3.5">
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
          <div className="mt-2 flex flex-wrap gap-3 text-[10.5px] text-ink-mute">
            <span><span className={cn('mr-1 inline-block h-0.5 w-2.5 align-middle', cfg.legendClass)}/> {babyName}</span>
            {metric === 'weight' && <>
              <span><span className="mr-1 inline-block h-0.5 w-2.5 bg-rose align-middle"/> WHO 50th</span>
              <span><span className="mr-1 inline-block h-px w-2.5 border-t border-dashed border-ink-mute align-middle"/> 3rd / 97th</span>
            </>}
          </div>
        </Card>
      </div>

      <div className="px-4 pt-3.5">
        <div className="px-1.5 pb-2 text-[11px] font-bold uppercase tracking-[0.6px] text-ink-mute">History</div>
        <Card pad={0}>
          {history.length === 0 ? (
            <div className="px-3.5 py-5 text-center text-[13px] text-ink-mute">No measurements yet</div>
          ) : history.map((e, i) => {
            const val = cfg.getVal(e);
            const prevEntry = history[i+1];
            const prevVal = prevEntry ? cfg.getVal(prevEntry) : null;
            const diffStr = prevVal !== null && val > 0 && prevVal > 0 ? cfg.delta(e, prevEntry!) : null;
            return (
              <div key={e.id} onClick={() => navigate({ to: '/log/growth-entry', search: { id: e.id } as never })} className={cn('flex cursor-pointer items-center gap-3 px-3.5 py-3', i && 'border-t border-rule')}>
                <div className="flex-1 text-[12.5px] text-ink-soft">
                  {new Date(e.measuredAt).toLocaleDateString([], { month: 'short', day: 'numeric' })}
                  {e.visitType === 'doctor' ? ' · Dr. visit' : ''}
                </div>
                <div className={cn('font-serif text-base font-medium', val > 0 ? 'text-ink' : 'text-ink-mute')}>{val > 0 ? val.toFixed(metric === 'weight' && prefs.weightUnit === 'kg' ? 2 : 1) : '—'} <span className="text-[11px] italic text-ink-mute">{cfg.unit}</span></div>
                <div className={cn('w-16 text-right text-[11.5px] font-semibold', diffStr ? 'text-sage' : 'text-ink-mute')}>
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
