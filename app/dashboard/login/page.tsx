"use client";

import Image from "next/image";
import Link from "next/link";
import { useState, type FormEvent } from "react";
import { useRouter } from "next/navigation";
import { apiRequest } from "../../../lib/api";
import styles from "./login.module.css";

type LoginResponse = {
  user: { id: string; email: string; role: "owner" };
};

/** Authenticates dashboard owners through the backend login endpoint. */
export default function DashboardLoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [submitting, setSubmitting] = useState(false);

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError("");
    setSubmitting(true);
    try {
      await apiRequest<LoginResponse>("/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password }),
      });
      window.localStorage.removeItem("ownerToken");
      router.replace("/dashboard");
    } catch {
      setError("Invalid email or password.");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <main className={styles.page}>
      <div className={styles.shell}>
        <header className={styles.header}>
          <Link href="/" className={styles.brand} aria-label="MahjongHu, back to home">
            <Image
              src="/logo-transparent.webp"
              alt=""
              width={56}
              height={56}
              className={styles.logo}
              priority
            />
            <span className={styles.brandName}>
              MahjongHu
              <small>BUSINESS SPACE</small>
            </span>
          </Link>
          <span className={styles.accessLabel}>OWNER ACCESS ONLY</span>
        </header>

        <div className={styles.content}>
          <section className={styles.intro} aria-labelledby="intro-title">
            <p className={styles.eyebrow}><span /> MAHJONGHU WORKSPACE</p>
            <h1 id="intro-title">
              Welcome to your <em>workspace.</em>
            </h1>
            <p className={styles.introCopy}>
              One place to view activity and manage MahjongHu operations.
            </p>
            <div className={styles.tiles} aria-hidden="true">
              <span className={styles.tile}><i /><i /><i /></span>
              <span className={styles.tile}><i /><i /><i /><i /></span>
              <span className={styles.tile}><i /><i /></span>
            </div>
          </section>

          <section className={styles.card} aria-labelledby="login-title">
            <div className={styles.cardHeading}>
              <span className={styles.cardEyebrow}>DASHBOARD ACCESS</span>
              <h2 id="login-title">Sign in to the dashboard</h2>
              <p>Use your owner account to continue.</p>
            </div>
            <form onSubmit={submit} className={styles.form}>
              <label className={styles.field}>
                <span>Email</span>
                <input
                  autoComplete="username"
                  type="email"
                  placeholder="name@email.com"
                  required
                  value={email}
                  onChange={(event) => setEmail(event.target.value)}
                />
              </label>
              <label className={styles.field}>
                <span>Password</span>
                <input
                  autoComplete="current-password"
                  type="password"
                  placeholder="Enter your password"
                  required
                  value={password}
                  onChange={(event) => setPassword(event.target.value)}
                />
              </label>
              {error && (
                <p className={styles.error} role="alert">
                  {error}
                </p>
              )}
              <button type="submit" disabled={submitting}>
                {submitting ? "Checking…" : "Sign in to dashboard"}
                <span aria-hidden="true">↗</span>
              </button>
            </form>
            <div className={styles.cardFooter}>
              <span>For the MahjongHu internal team only</span>
              <Link href="/">Back to home <span aria-hidden="true">↗</span></Link>
            </div>
          </section>
        </div>
        <footer className={styles.footer}>© MahjongHu · Business Space</footer>
      </div>
    </main>
  );
}
