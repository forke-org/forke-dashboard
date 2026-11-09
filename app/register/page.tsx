"use client";
import Link from "next/link";
import { useState } from "react";
import AuthShell, { GoogleIcon, GitHubIcon } from "@/components/auth/AuthShell";
import s from "@/components/auth/auth.module.css";

type Role = "client" | "developer" | null;
type F = { name: string; label: string; ph: string; type?: string; optional?: boolean; half?: boolean };

const CLIENT: F[] = [
  { name: "first", label: "First name", ph: "John", half: true },
  { name: "last", label: "Last name", ph: "Doe", half: true },
  { name: "phone", label: "Contact number", ph: "+91 00000 00000", type: "tel", half: true },
  { name: "email", label: "Contact email", ph: "john@company.com", type: "email", half: true },
  { name: "company", label: "Company name", ph: "Acme Inc.", half: true },
  { name: "site", label: "Company website", ph: "https://acme.com", optional: true, half: true },
  { name: "li", label: "Personal LinkedIn", ph: "linkedin.com/in/johndoe" },
  { name: "cli", label: "Company LinkedIn", ph: "linkedin.com/company/acme" },
  { name: "role", label: "Designation", ph: "CTO / Founder / Engineering Manager" },
  { name: "links", label: "Other relevant links", ph: "Portfolio, GitHub org, press…", optional: true },
];
const DEV: F[] = [
  { name: "first", label: "First name", ph: "John", half: true },
  { name: "last", label: "Last name", ph: "Doe", half: true },
  { name: "email", label: "Email address", ph: "name@example.com", type: "email" },
  { name: "username", label: "Username", ph: "cool-dev_123" },
  { name: "password", label: "Password", ph: "••••••••", type: "password" },
];

function Fields({ list }: { list: F[] }) {
  const out: React.ReactNode[] = [];
  for (let i = 0; i < list.length; i++) {
    const f = list[i];
    const one = (x: F) => (
      <label className={s.field} key={x.name}>
        <span>{x.label}{x.optional && <i> (optional)</i>}</span>
        <input className={s.input} name={x.name} type={x.type ?? "text"} placeholder={x.ph} required={!x.optional} />
      </label>
    );
    if (f.half && list[i + 1]?.half) { out.push(<div className={s.row2} key={f.name}>{one(f)}{one(list[i + 1])}</div>); i++; }
    else out.push(one(f));
  }
  return <>{out}</>;
}

export default function SignupPage() {
  const [role, setRole] = useState<Role>(null);

  const submit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const data = Object.fromEntries(new FormData(e.currentTarget));
    // TODO: send { role, ...data } to your API
    console.log(role, data);
  };

  return (
    <AuthShell wide={role === "client"}>
      {!role ? (
        <>
          <p className={s.eyebrow}>How would you like to join?</p>
          <h1 className={s.title}>Choose your <em>path</em></h1>
          <p className={s.sub}>You can always switch later.</p>
          <div className={s.options}>
            <button className={s.option} onClick={() => setRole("client")}>
              <span className={s.optionIcon}><svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="7" width="18" height="13" rx="2.5" /><path d="M9 7V5.5A1.5 1.5 0 0 1 10.5 4h3A1.5 1.5 0 0 1 15 5.5V7M3 13h18" /></svg></span>
              <span><strong>Post tasks</strong><small>Hire developers for your projects.</small></span>
              <svg className={s.chevron} width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><path d="m9 6 6 6-6 6" /></svg>
            </button>
            <button className={s.option} onClick={() => setRole("developer")}>
              <span className={s.optionIcon}><svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round"><path d="m8 8-4 4 4 4M16 8l4 4-4 4M13.5 5l-3 14" /></svg></span>
              <span><strong>Do tasks</strong><small>Pick up bounties and get paid.</small></span>
              <svg className={s.chevron} width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><path d="m9 6 6 6-6 6" /></svg>
            </button>
          </div>
          <p className={s.swap}>Already on Forke? <Link href="/signin">Sign in</Link></p>
        </>
      ) : (
        <>
          <button className={s.back} onClick={() => setRole(null)}><svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><path d="m15 6-6 6 6 6" /></svg> Change path</button>
          <h1 className={s.title}>{role === "client" ? <>Post Tasks <em>application</em></> : <>Join the <em>movement</em></>}</h1>
          <p className={s.sub}>{role === "client" ? "Tell us about yourself and your company." : "Registering as a developer."}</p>

          {role === "developer" && (
            <>
              <div className={s.social}>
                <button type="button" className={s.btn}><GoogleIcon /> Google</button>
                <button type="button" className={s.btn}><GitHubIcon /> GitHub</button>
              </div>
              <div className={s.divider}>or</div>
            </>
          )}

          <form onSubmit={submit}>
            <div>
              <Fields list={role === "client" ? CLIENT : DEV} />
              {role === "client" && (
                <>
                  <label className={s.field}>
                    <span>Message <i>(optional)</i></span>
                    <textarea className={s.input} name="message" placeholder="Tell us about the tasks you plan to post…" />
                  </label>
                  <button type="button" className={s.btn} style={{ width: "100%" }}><GoogleIcon /> Verify identity with Google</button>
                </>
              )}
            </div>
            <label className={s.check}><input type="checkbox" required /><span>I agree to the <Link className={s.link} href="/terms">Terms</Link> and <Link className={s.link} href="/privacy">Privacy Policy</Link></span></label>
            <label className={s.check}><input type="checkbox" name="promo" /><span>I would like to receive promotional emails, product updates, and special offers.</span></label>
            <button className={s.primary} type="submit">{role === "client" ? "Submit application" : "Create account"}</button>
          </form>
          <p className={s.swap}>Already on Forke? <Link href="/signin">Sign in</Link></p>
        </>
      )}
    </AuthShell>
  );
}
