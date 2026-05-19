import React, { useState } from "react";
import { signIn, signUp, authClient } from "../auth/client";

type Mode = "signin" | "signup";

export function LoginScreen() {
  const [mode, setMode] = useState<Mode>("signin");
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    setLoading(true);
    try {
      if (mode === "signin") {
        const res = await signIn.email({ email, password });
        if (res.error) setError(res.error.message ?? "Sign in failed");
      } else {
        const res = await signUp.email({ name, email, password });
        if (res.error) setError(res.error.message ?? "Sign up failed");
      }
    } catch (err) {
      setError("Something went wrong. Please try again.");
    } finally {
      setLoading(false);
    }
  }

  const inputClassName =
    "w-full appearance-none box-border rounded-[14px] border-[1.5px] border-rule bg-card px-4 py-[14px] font-sans text-[15px] text-ink outline-none";
  const labelClassName =
    "mb-1.5 block text-[11.5px] font-bold uppercase tracking-[0.4px] text-ink-soft";

  return (
    <div className="flex min-h-full w-full flex-col items-center justify-center box-border bg-cream px-7 py-10 font-sans">
      {/* Logo / Baby avatar */}
      <div className="mb-8 text-center">
        <div
          className="mx-auto mb-4 flex h-20 w-20 items-center justify-center rounded-[40px] bg-[linear-gradient(135deg,var(--color-terracotta-soft),var(--color-honey-soft))] text-4xl shadow-card-lg"
        >
          👶
        </div>
        <div className="font-serif text-[28px] leading-[1.1] tracking-[-0.5px] text-ink">
          Newborn Care
        </div>
        <div className="mt-1 text-[13px] text-ink-mute">
          Track your baby's daily care
        </div>
      </div>

      {/* Mode toggle */}
      <div className="mb-6 inline-flex gap-0.5 rounded-[14px] bg-black/[0.04] p-1">
        {(["signin", "signup"] as Mode[]).map((m) => (
          <button
            key={m}
            onClick={() => {
              setMode(m);
              setError("");
            }}
            className={`cursor-pointer rounded-[11px] border-0 px-[22px] py-[9px] font-sans text-sm font-bold transition-all duration-150 ${
              mode === m
                ? "bg-card text-terracotta shadow-[0_1px_2px_rgba(0,0,0,0.06)]"
                : "bg-transparent text-ink-soft shadow-none"
            }`}
          >
            {m === "signin" ? "Sign in" : "Sign up"}
          </button>
        ))}
      </div>

      {/* Form */}
      <form
        onSubmit={handleSubmit}
        className="flex w-full max-w-[360px] flex-col gap-3"
      >
        {mode === "signup" && (
          <div>
            <label className={labelClassName}>
              Your name
            </label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="e.g. Hakim"
              required
              className={inputClassName}
            />
          </div>
        )}

        <div>
          <label className={labelClassName}>
            Email
          </label>
          <input
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="you@example.com"
            required
            className={inputClassName}
          />
        </div>

        <div>
          <label className={labelClassName}>
            Password
          </label>
          <input
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder={
              mode === "signup" ? "At least 8 characters" : "••••••••"
            }
            required
            minLength={mode === "signup" ? 8 : undefined}
            className={inputClassName}
          />
        </div>

        {error && (
          <div className="rounded-xl bg-[#FDE8E8] px-3.5 py-2.5 text-[13px] font-medium leading-[1.4] text-[#C0392B]">
            {error}
          </div>
        )}

        <button
          type="submit"
          disabled={loading}
          className={`mt-1 w-full rounded-2xl border-0 py-[15px] font-sans text-[15px] font-bold tracking-[0.2px] transition-all duration-150 ${
            loading
              ? "cursor-not-allowed bg-terracotta-soft text-terracotta"
              : "cursor-pointer bg-terracotta text-card"
          }`}
        >
          {loading
            ? mode === "signin"
              ? "Signing in…"
              : "Creating account…"
            : mode === "signin"
              ? "Sign in"
              : "Create account"}
        </button>
      </form>

      {/* Divider */}
      <div className="my-5 flex w-full max-w-[360px] items-center gap-3">
        <div className="h-px flex-1 bg-rule" />
        <span className="text-xs font-semibold tracking-[0.4px] text-ink-mute">OR</span>
        <div className="h-px flex-1 bg-rule" />
      </div>

      {/* Google */}
      <button
        onClick={() => authClient.signIn.social({ provider: 'google', callbackURL: window.location.origin })}
        className="flex w-full max-w-[360px] cursor-pointer items-center justify-center gap-2.5 rounded-2xl border-[1.5px] border-rule bg-card py-[14px] font-sans text-[15px] font-semibold text-ink"
      >
        <svg width="18" height="18" viewBox="0 0 48 48">
          <path fill="#EA4335" d="M24 9.5c3.54 0 6.71 1.22 9.21 3.6l6.85-6.85C35.9 2.38 30.47 0 24 0 14.62 0 6.51 5.38 2.56 13.22l7.98 6.19C12.43 13.72 17.74 9.5 24 9.5z"/>
          <path fill="#4285F4" d="M46.98 24.55c0-1.57-.15-3.09-.38-4.55H24v9.02h12.94c-.58 2.96-2.26 5.48-4.78 7.18l7.73 6c4.51-4.18 7.09-10.36 7.09-17.65z"/>
          <path fill="#FBBC05" d="M10.53 28.59c-.48-1.45-.76-2.99-.76-4.59s.27-3.14.76-4.59l-7.98-6.19C.92 16.46 0 20.12 0 24c0 3.88.92 7.54 2.56 10.78l7.97-6.19z"/>
          <path fill="#34A853" d="M24 48c6.48 0 11.93-2.13 15.89-5.81l-7.73-6c-2.18 1.48-4.97 2.31-8.16 2.31-6.26 0-11.57-4.22-13.47-9.91l-7.98 6.19C6.51 42.62 14.62 48 24 48z"/>
          <path fill="none" d="M0 0h48v48H0z"/>
        </svg>
        Continue with Google
      </button>

      <div className="mt-5 text-center text-[12.5px] leading-[1.5] text-ink-mute">
        {mode === "signin" ? (
          <>
            No account?{" "}
            <button
              onClick={() => setMode("signup")}
              className="cursor-pointer border-0 bg-transparent p-0 font-sans text-[12.5px] font-semibold text-terracotta"
            >
              Sign up
            </button>
          </>
        ) : (
          <>
            Already have an account?{" "}
            <button
              onClick={() => setMode("signin")}
              className="cursor-pointer border-0 bg-transparent p-0 font-sans text-[12.5px] font-semibold text-terracotta"
            >
              Sign in
            </button>
          </>
        )}
      </div>
    </div>
  );
}
