import React, { useState } from 'react';
import { T, fonts } from '../tokens';
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

  const inputStyle: React.CSSProperties = {
    width: '100%', padding: '14px 16px', borderRadius: 14,
    border: `1.5px solid ${T.rule}`, background: T.card,
    fontFamily: fonts.sans, fontSize: 15, color: T.ink,
    outline: 'none', boxSizing: 'border-box', WebkitAppearance: 'none',
  };

  return (
    <div style={{
      width: '100%', minHeight: '100%', background: T.cream,
      fontFamily: fonts.sans, display: 'flex', flexDirection: 'column',
      alignItems: 'center', justifyContent: 'center',
      padding: 'max(40px, env(safe-area-inset-top)) 28px max(40px, env(safe-area-inset-bottom))',
      boxSizing: 'border-box',
    }}>
      <div style={{ textAlign: 'center', marginBottom: 32 }}>
        <div style={{
          width: 80, height: 80, borderRadius: 40,
          background: `linear-gradient(135deg, ${T.terracottaSoft}, ${T.honeySoft})`,
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          fontSize: 36, margin: '0 auto 16px', boxShadow: T.shadowLg,
        }}>👶</div>
        <div style={{ fontFamily: fonts.serif, fontSize: 28, color: T.ink, letterSpacing: -0.5, lineHeight: 1.15 }}>
          Add your baby
        </div>
        <div style={{ fontSize: 13, color: T.inkMute, marginTop: 6 }}>
          Let's get you set up
        </div>
      </div>

      <form onSubmit={handleSubmit} style={{ width: '100%', maxWidth: 360, display: 'flex', flexDirection: 'column', gap: 14 }}>
        <div>
          <label style={{ fontSize: 11.5, fontWeight: 700, color: T.inkSoft, letterSpacing: 0.4, textTransform: 'uppercase', display: 'block', marginBottom: 6 }}>
            Baby's name *
          </label>
          <input type="text" value={name} onChange={e => setName(e.target.value)}
            placeholder="e.g. Saif" required style={inputStyle} />
        </div>

        <div>
          <label style={{ fontSize: 11.5, fontWeight: 700, color: T.inkSoft, letterSpacing: 0.4, textTransform: 'uppercase', display: 'block', marginBottom: 6 }}>
            Date of birth *
          </label>
          <input type="date" value={birthDate} onChange={e => setBirthDate(e.target.value)}
            required max={new Date().toISOString().slice(0, 10)}
            style={{ ...inputStyle, colorScheme: 'light' }} />
        </div>

        <div>
          <label style={{ fontSize: 11.5, fontWeight: 700, color: T.inkSoft, letterSpacing: 0.4, textTransform: 'uppercase', display: 'block', marginBottom: 8 }}>
            Gender
          </label>
          <div style={{ display: 'flex', gap: 8 }}>
            {(['boy', 'girl', 'other'] as const).map(g => (
              <button key={g} type="button" onClick={() => setGender(gender === g ? '' : g)} style={{
                flex: 1, padding: '10px 0', borderRadius: 12, border: `1.5px solid ${gender === g ? T.terracotta : T.rule}`,
                background: gender === g ? T.terracottaSoft : T.card,
                color: gender === g ? T.terracotta : T.inkSoft,
                fontFamily: fonts.sans, fontSize: 13, fontWeight: 600, cursor: 'pointer',
                textTransform: 'capitalize',
              }}>{g}</button>
            ))}
          </div>
        </div>

        <div>
          <label style={{ fontSize: 11.5, fontWeight: 700, color: T.inkSoft, letterSpacing: 0.4, textTransform: 'uppercase', display: 'block', marginBottom: 6 }}>
            Doctor's name
          </label>
          <input type="text" value={doctorName} onChange={e => setDoctorName(e.target.value)}
            placeholder="e.g. Dr. Smith" style={inputStyle} />
        </div>

        {error && (
          <div style={{ padding: '10px 14px', borderRadius: 12, background: '#FDE8E8', color: '#C0392B', fontSize: 13 }}>
            {error}
          </div>
        )}

        <button type="submit" disabled={loading || !name.trim() || !birthDate} style={{
          marginTop: 4, width: '100%', padding: '15px 0', borderRadius: 16, border: 'none',
          background: loading || !name.trim() || !birthDate ? T.terracottaSoft : T.terracotta,
          color: loading || !name.trim() || !birthDate ? T.terracotta : T.card,
          fontFamily: fonts.sans, fontSize: 15, fontWeight: 700,
          cursor: loading || !name.trim() || !birthDate ? 'not-allowed' : 'pointer',
          letterSpacing: 0.2,
        }}>
          {loading ? 'Creating…' : 'Get started'}
        </button>
      </form>
    </div>
  );
}
