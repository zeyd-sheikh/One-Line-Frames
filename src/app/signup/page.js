import Link from "next/link";
import { redirect } from "next/navigation";
import AuthSubmitButton from "../../components/AuthSubmitButton";
import PageIntro from "../../components/PageIntro";
import { ROUTES } from "../../constants/routes";
import { getAuthenticatedUser } from "../../lib/auth";
import { signup } from "../auth/actions";

export const metadata = {
  title: "Create an account",
};

export default async function SignupPage({ searchParams }) {
  const [{ claims }, params] = await Promise.all([
    getAuthenticatedUser(),
    searchParams,
  ]);

  if (claims) {
    redirect(ROUTES.profile);
  }

  const error = typeof params?.error === "string" ? params.error : "";
  const message = typeof params?.message === "string" ? params.message : "";

  return (
    <main className="page-shell page-shell-narrow">
      <PageIntro
        eyebrow="account access"
        title="create an account"
        description="Anyone with an email address can join. Confirm your email before submitting a moment."
      />

      <form className="auth-form" action={signup}>
        <div className="auth-field">
          <label htmlFor="displayName">display name</label>
          <input
            id="displayName"
            name="displayName"
            type="text"
            autoComplete="name"
            maxLength={80}
            required
          />
          <small>This becomes your default public name.</small>
        </div>

        <div className="auth-field">
          <label htmlFor="email">email</label>
          <input
            id="email"
            name="email"
            type="email"
            autoComplete="email"
            required
          />
        </div>

        <div className="auth-field">
          <label htmlFor="password">password</label>
          <input
            id="password"
            name="password"
            type="password"
            autoComplete="new-password"
            minLength={8}
            required
          />
          <small>Use at least 8 characters.</small>
        </div>

        <div className="auth-field">
          <label htmlFor="confirmPassword">confirm password</label>
          <input
            id="confirmPassword"
            name="confirmPassword"
            type="password"
            autoComplete="new-password"
            minLength={8}
            required
          />
        </div>

        {error ? (
          <p className="auth-message auth-error" role="alert">
            {error}
          </p>
        ) : null}
        {message ? <p className="auth-message auth-success">{message}</p> : null}

        <AuthSubmitButton pendingText="creating account...">
          create account
        </AuthSubmitButton>
      </form>

      <p className="page-link-note">
        Already registered? <Link href={ROUTES.login}>Log in.</Link>
      </p>
    </main>
  );
}
