import React, { useState } from 'react';
import { api } from '../api/client';
import { useBaby } from '../context/BabyContext';

export function SetupScreen() {
  const { refetch } = useBaby();
  const [name, setName] = useState('');
  const [birthDate, setBirthDate] = useState('');
  const [gender, setGender] = useState<'boy' | 'girl' | 'other' | ''>('');
  const [doctorName, setDoctorName] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!name.trim() || !birthDate) return;
    setLoading(true);
    setError('');
    try {
      await api.babies.create({
        name: name.trim(),
        birthDate,
        gender: gender || null,
        doctorName: doctorName.trim() || null,
        createdAt: new Date().toISOString(),
      });
      await refetch();
    } catch {
      setError('Something went wrong. Please try again.');
      setLoading(false);
    }
  }

  const inputClassName =
    'w-full appearance-none box-border rounded-[14px] border-[1.5px] border-rule bg-card px-4 py-[14px] font-sans text-[15px] text-ink outline-none';
  const labelClassName =
    'mb-1.5 block text-[11.5px] font-bold uppercase tracking-[0.4px] text-ink-soft';

  return (
    <div className="flex min-h-full w-full flex-col items-center justify-center box-border bg-cream px-7 pt-[max(40px,env(safe-area-inset-top))] pb-[max(40px,env(safe-area-inset-bottom))] font-sans">
      <div className="mb-8 text-center">
        <div className="mx-auto mb-4 flex h-20 w-20 items-center justify-center rounded-[40px] bg-[linear-gradient(135deg,var(--color-terracotta-soft),var(--color-honey-soft))] text-4xl shadow-card-lg">👶</div>
        <div className="font-serif text-[28px] leading-[1.15] tracking-[-0.5px] text-ink">
          Add your baby
        </div>
        <div className="mt-1.5 text-[13px] text-ink-mute">
          Let's get you set up
        </div>
      </div>

      <form onSubmit={handleSubmit} className="flex w-full max-w-[360px] flex-col gap-3.5">
        <div>
          <label className={labelClassName}>
            Baby's name *
          </label>
          <input type="text" value={name} onChange={e => setName(e.target.value)}
            placeholder="e.g. Saif" required className={inputClassName} />
        </div>

        <div>
          <label className={labelClassName}>
            Date of birth *
          </label>
          <input type="date" value={birthDate} onChange={e => setBirthDate(e.target.value)}
            required max={new Date().toISOString().slice(0, 10)}
            className={`${inputClassName} [color-scheme:light]`} />
        </div>

        <div>
          <label className={`${labelClassName} mb-2`}>
            Gender
          </label>
          <div className="flex gap-2">
            {(['boy', 'girl', 'other'] as const).map(g => (
              <button
                key={g}
                type="button"
                onClick={() => setGender(gender === g ? '' : g)}
                className={`flex-1 cursor-pointer rounded-xl border-[1.5px] py-2.5 font-sans text-[13px] font-semibold capitalize ${
                  gender === g
                    ? 'border-terracotta bg-terracotta-soft text-terracotta'
                    : 'border-rule bg-card text-ink-soft'
                }`}
              >{g}</button>
            ))}
          </div>
        </div>

        <div>
          <label className={labelClassName}>
            Doctor's name
          </label>
          <input type="text" value={doctorName} onChange={e => setDoctorName(e.target.value)}
            placeholder="e.g. Dr. Smith" className={inputClassName} />
        </div>

        {error && (
          <div className="rounded-xl bg-[#FDE8E8] px-3.5 py-2.5 text-[13px] text-[#C0392B]">
            {error}
          </div>
        )}

        <button
          type="submit"
          disabled={loading || !name.trim() || !birthDate}
          className={`mt-1 w-full rounded-2xl border-0 py-[15px] font-sans text-[15px] font-bold tracking-[0.2px] ${
            loading || !name.trim() || !birthDate
              ? 'cursor-not-allowed bg-terracotta-soft text-terracotta'
              : 'cursor-pointer bg-terracotta text-card'
          }`}
        >
          {loading ? 'Creating…' : 'Get started'}
        </button>
      </form>
    </div>
  );
}
