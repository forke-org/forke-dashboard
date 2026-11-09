"use client";
import Link from "next/link";
import { useState } from "react";
import AuthShell, { MailIcon, Spinner, DoneMark } from "@/components/auth/AuthShell";
import s from "@/components/auth/auth.module.css";

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState("");
  const [busy, setBusy] = useState(false);
  const [sent, setSent] = useState(false);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (busy) return;
    setBusy(true);
    // TODO: request a reset link for { email }
    await new Promise((r) => setTimeout(r, 900)); // placeholder latency - remove once wired up
    setBusy(false);
    setSent(true);
  };

  return (
    <AuthShell>
      <div className={s.step} key={sent ? "sent" : "form"}>
        {sent ? (
          <div className={s.done}>
            <DoneMark />
            <h1 className={s.title}>Check your email</h1>
            <p className={s.sub}>If an account exists for <strong>{email}</strong>, a link to reset your password is on its way.</p>
            <Link href="/signin" className={s.primary}>Back to sign in</Link>
          </div>
        ) : (
          <>
            <h1 className={s.title}>Reset your password</h1>
            <p className={s.sub}>Enter the email you signed up with and we&apos;ll send you a reset link.</p>
            <form onSubmit={submit}>
              <label className={s.field}>
                <span>Email</span>
                <div className={s.control}>
                  <i className={s.icon}><MailIcon /></i>
                  <input className={`${s.input} ${s.withIcon}`} type="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="name@example.com" autoComplete="email" required />
                </div>
              </label>
              <button className={s.primary} type="submit" disabled={busy} aria-busy={busy}>
                {busy ? <><Spinner /> Sending…</> : "Send reset link"}
              </button>
            </form>
            <p className={s.swap}><Link href="/signin">Back to sign in</Link></p>
          </>
        )}
      </div>
    </AuthShell>
  );
}
