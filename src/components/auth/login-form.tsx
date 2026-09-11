"use client";

import { LoaderCircle, MoveRight } from "lucide-react";
import { useState } from "react";

import { authClient } from "@/lib/auth-client";

import styles from "./auth-shell.module.css";

const showDevelopmentCredentials = process.env.NODE_ENV !== "production";

export function LoginForm() {
  const [error, setError] = useState<string>();
  const [isPending, setIsPending] = useState(false);

  async function onSubmit(formData: FormData) {
    setError(undefined);
    setIsPending(true);

    try {
      const result = await authClient.signIn.email({
        email: String(formData.get("email") ?? ""),
        password: String(formData.get("password") ?? ""),
        callbackURL: "/admin",
      });

      if (result.error) {
        setError(result.error.message ?? "We could not sign you in. Please try again.");
      }
    } catch {
      setError("We could not connect to the sign-in service. Please try again.");
    } finally {
      setIsPending(false);
    }
  }

  return (
    <form action={onSubmit} className={styles.authForm}>
      <label className={styles.field}>
        <span className={styles.fieldLabel}>Email address</span>
        <input autoComplete="email" className={styles.input} name="email" placeholder={showDevelopmentCredentials ? "dev@cafe.co.id" : "Enter your email"} required type="email" />
      </label>
      <label className={styles.field}>
        <span className={styles.fieldLabel}>Password</span>
        <input autoComplete="current-password" className={styles.input} name="password" placeholder={showDevelopmentCredentials ? "Cafe123@" : "Enter your password"} required type="password" />
      </label>
      {error ? <p className={styles.error} role="alert">{error}</p> : null}
      <button className={styles.submitButton} disabled={isPending} type="submit">
        {isPending ? <LoaderCircle aria-hidden="true" className="animate-spin" size={16} /> : null}
        {isPending ? "Signing in…" : "Sign in to CMS"}
        {!isPending ? <MoveRight aria-hidden="true" size={16} /> : null}
      </button>
      {showDevelopmentCredentials ? <p className={styles.formNote}>Development access: dev@cafe.co.id / Cafe123@</p> : null}
      <p className={styles.formNote}>Private access for approved Kōhi team members only.</p>
    </form>
  );
}
