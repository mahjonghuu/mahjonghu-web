"use client";

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
      setError("Email atau password tidak valid.");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <main className={styles.page}>
      <section className={styles.card}>
        <h1>Masuk ke dashboard</h1>
        <p>Gunakan akun owner untuk mengakses ruang kerja.</p>
        <form onSubmit={submit} className={styles.form}>
          <label className={styles.field}>
            Email
            <input
              autoComplete="username"
              type="email"
              required
              value={email}
              onChange={(event) => setEmail(event.target.value)}
            />
          </label>
          <label className={styles.field}>
            Password
            <input
              autoComplete="current-password"
              type="password"
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
            {submitting ? "Memeriksa…" : "Masuk"}
          </button>
        </form>
      </section>
    </main>
  );
}
