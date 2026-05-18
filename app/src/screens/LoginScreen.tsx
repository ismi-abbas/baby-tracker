import React, { useState } from "react";
import { T, fonts } from "../tokens";
import { signIn, signUp } from "../auth/client";

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

  const inputStyle: React.CSSProperties = {
    width: "100%",
    padding: "14px 16px",
    borderRadius: 14,
    border: `1.5px solid ${T.rule}`,
    background: T.card,
    fontFamily: fonts.sans,
    fontSize: 15,
    color: T.ink,
    outline: "none",
    boxSizing: "border-box",
    WebkitAppearance: "none",
  };

  return (
    <div
      style={{
        width: "100%",
        minHeight: "100%",
        background: T.cream,
        fontFamily: fonts.sans,
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        paddingTop: "max(40px, env(safe-area-inset-top))",
        paddingBottom: "max(40px, env(safe-area-inset-bottom))",
        padding: "40px 28px",
        boxSizing: "border-box",
      }}
    >
      {/* Logo / Baby avatar */}
      <div style={{ textAlign: "center", marginBottom: 32 }}>
        <div
          style={{
            width: 80,
            height: 80,
            borderRadius: 40,
            background: `linear-gradient(135deg, ${T.terracottaSoft}, ${T.honeySoft})`,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            fontSize: 36,
            margin: "0 auto 16px",
            boxShadow: T.shadowLg,
          }}
        >
          👶
        </div>
        <div
          style={{
            fontFamily: fonts.serif,
            fontSize: 28,
            color: T.ink,
            letterSpacing: -0.5,
            lineHeight: 1.1,
          }}
        >
          Newborn Care
        </div>
        <div style={{ fontSize: 13, color: T.inkMute, marginTop: 4 }}>
          Track everything for{" "}
          <span style={{ color: T.terracotta, fontWeight: 600 }}>Saif</span>
        </div>
      </div>

      {/* Mode toggle */}
      <div
        style={{
          display: "inline-flex",
          padding: 4,
          borderRadius: 14,
          background: "rgba(0,0,0,0.04)",
          gap: 2,
          marginBottom: 24,
        }}
      >
        {(["signin", "signup"] as Mode[]).map((m) => (
          <button
            key={m}
            onClick={() => {
              setMode(m);
              setError("");
            }}
            style={{
              padding: "9px 22px",
              borderRadius: 11,
              border: "none",
              cursor: "pointer",
              background: mode === m ? T.card : "transparent",
              color: mode === m ? T.terracotta : T.inkSoft,
              fontFamily: fonts.sans,
              fontSize: 14,
              fontWeight: 700,
              boxShadow: mode === m ? "0 1px 2px rgba(0,0,0,0.06)" : "none",
              transition: "all 0.15s",
            }}
          >
            {m === "signin" ? "Sign in" : "Sign up"}
          </button>
        ))}
      </div>

      {/* Form */}
      <form
        onSubmit={handleSubmit}
        style={{
          width: "100%",
          maxWidth: 360,
          display: "flex",
          flexDirection: "column",
          gap: 12,
        }}
      >
        {mode === "signup" && (
          <div>
            <label
              style={{
                fontSize: 11.5,
                fontWeight: 700,
                color: T.inkSoft,
                letterSpacing: 0.4,
                textTransform: "uppercase",
                display: "block",
                marginBottom: 6,
              }}
            >
              Your name
            </label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="e.g. Hakim"
              required
              style={inputStyle}
            />
          </div>
        )}

        <div>
          <label
            style={{
              fontSize: 11.5,
              fontWeight: 700,
              color: T.inkSoft,
              letterSpacing: 0.4,
              textTransform: "uppercase",
              display: "block",
              marginBottom: 6,
            }}
          >
            Email
          </label>
          <input
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="you@example.com"
            required
            style={inputStyle}
          />
        </div>

        <div>
          <label
            style={{
              fontSize: 11.5,
              fontWeight: 700,
              color: T.inkSoft,
              letterSpacing: 0.4,
              textTransform: "uppercase",
              display: "block",
              marginBottom: 6,
            }}
          >
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
            style={inputStyle}
          />
        </div>

        {error && (
          <div
            style={{
              padding: "10px 14px",
              borderRadius: 12,
              background: "#FDE8E8",
              color: "#C0392B",
              fontSize: 13,
              fontWeight: 500,
              lineHeight: 1.4,
            }}
          >
            {error}
          </div>
        )}

        <button
          type="submit"
          disabled={loading}
          style={{
            marginTop: 4,
            width: "100%",
            padding: "15px 0",
            borderRadius: 16,
            border: "none",
            background: loading ? T.terracottaSoft : T.terracotta,
            color: loading ? T.terracotta : T.card,
            fontFamily: fonts.sans,
            fontSize: 15,
            fontWeight: 700,
            cursor: loading ? "not-allowed" : "pointer",
            letterSpacing: 0.2,
            transition: "all 0.15s",
          }}
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

      <div
        style={{
          marginTop: 24,
          fontSize: 12.5,
          color: T.inkMute,
          textAlign: "center",
          lineHeight: 1.5,
        }}
      >
        {mode === "signin" ? (
          <>
            No account?{" "}
            <button
              onClick={() => setMode("signup")}
              style={{
                background: "none",
                border: "none",
                color: T.terracotta,
                fontFamily: fonts.sans,
                fontSize: 12.5,
                fontWeight: 600,
                cursor: "pointer",
                padding: 0,
              }}
            >
              Sign up
            </button>
          </>
        ) : (
          <>
            Already have an account?{" "}
            <button
              onClick={() => setMode("signin")}
              style={{
                background: "none",
                border: "none",
                color: T.terracotta,
                fontFamily: fonts.sans,
                fontSize: 12.5,
                fontWeight: 600,
                cursor: "pointer",
                padding: 0,
              }}
            >
              Sign in
            </button>
          </>
        )}
      </div>
    </div>
  );
}
