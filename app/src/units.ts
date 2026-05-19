import { useEffect, useState } from 'react';

export type MilkUnit = 'ml' | 'oz';
export type WeightUnit = 'kg' | 'lb';
export type LengthUnit = 'cm' | 'in';

export interface UnitPrefs {
  milkUnit: MilkUnit;
  weightUnit: WeightUnit;
  lengthUnit: LengthUnit;
}

const KEY = 'baby-tracker:unit-prefs';
const DEFAULT_PREFS: UnitPrefs = { milkUnit: 'ml', weightUnit: 'kg', lengthUnit: 'cm' };
const ML_PER_OZ = 29.5735;
const G_PER_LB = 453.59237;
const CM_PER_IN = 2.54;

function readPrefs(): UnitPrefs {
  try {
    const raw = window.localStorage.getItem(KEY);
    if (!raw) return DEFAULT_PREFS;
    const parsed = JSON.parse(raw) as Partial<UnitPrefs>;
    return {
      milkUnit: parsed.milkUnit === 'oz' ? 'oz' : 'ml',
      weightUnit: parsed.weightUnit === 'lb' ? 'lb' : 'kg',
      lengthUnit: parsed.lengthUnit === 'in' ? 'in' : 'cm',
    };
  } catch {
    return DEFAULT_PREFS;
  }
}

export function useUnitPrefs() {
  const [prefs, setPrefs] = useState<UnitPrefs>(() => readPrefs());

  useEffect(() => {
    window.localStorage.setItem(KEY, JSON.stringify(prefs));
  }, [prefs]);

  return { prefs, setPrefs };
}

export function mlToDisplay(ml: number, unit: MilkUnit) {
  return unit === 'oz' ? ml / ML_PER_OZ : ml;
}

export function milkDeltaToMl(delta: number, unit: MilkUnit) {
  return Math.round(unit === 'oz' ? delta * ML_PER_OZ : delta);
}

export function formatMilk(ml?: number | null, unit: MilkUnit = 'ml') {
  if (!ml) return '—';
  const value = mlToDisplay(ml, unit);
  return `${unit === 'oz' ? value.toFixed(1) : Math.round(value)} ${unit}`;
}

export function gramsToDisplay(g: number, unit: WeightUnit) {
  return unit === 'lb' ? g / G_PER_LB : g / 1000;
}

export function weightDeltaToGrams(delta: number, unit: WeightUnit) {
  return Math.round(unit === 'lb' ? delta * G_PER_LB : delta * 1000);
}

export function formatWeight(g?: number | null, unit: WeightUnit = 'kg') {
  if (!g) return '—';
  const value = gramsToDisplay(g, unit);
  return `${value.toFixed(unit === 'lb' ? 1 : 2)} ${unit}`;
}

export function cmToDisplay(cm: number, unit: LengthUnit) {
  return unit === 'in' ? cm / CM_PER_IN : cm;
}

export function lengthDeltaToCm(delta: number, unit: LengthUnit) {
  return unit === 'in' ? delta * CM_PER_IN : delta;
}

export function formatLength(cm?: number | null, unit: LengthUnit = 'cm') {
  if (!cm) return '—';
  return `${cmToDisplay(cm, unit).toFixed(unit === 'in' ? 1 : 0)} ${unit}`;
}
