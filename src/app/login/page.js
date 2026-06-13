import Link from "next/link";
import { redirect } from "next/navigation";
import AuthArtwork from "../../components/AuthArtwork";
import AuthSubmitButton from "../../components/AuthSubmitButton";
import Icon from "../../components/Icon";
import { ROUTES } from "../../constants/routes";
import { getAuthenticatedUser } from "../../lib/auth";
import { login } from "../auth/actions";

export const metadata = {
  title: "Log in",
};

export default async function LoginPage({ searchParams }) {
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
    <main className="auth-page">
      <div className="auth-layout">
        <section className="auth-content">
          <div className="auth-heading">
            <div className="auth-heading-icon">
              <Icon name="user" size={18} />
            </div>
            <p className="eyebrow">welcome back</p>
            <h1>return to your moments.</h1>
            <p>
              Your profile, submissions, and moderation updates stay private to
              your account.
            </p>
          </div>

          <form className="auth-form" action={login}>
            <div className="auth-field">
              <label htmlFor="email">email</label>
              <input
                id="email"
                name="email"
                type="email"
                autoComplete="email"
                placeholder="you@example.com"
                required
              />
            </div>

            <div className="auth-field">
              <label htmlFor="password">password</label>
              <input
                id="password"
                name="password"
                type="password"
                autoComplete="current-password"
                placeholder="your password"
                required
              />
            </div>

            {error ? (
              <p className="auth-message auth-error" role="alert">
                {error}
              </p>
            ) : null}
            {message ? (
              <p className="auth-message auth-success">{message}</p>
            ) : null}

            <AuthSubmitButton pendingText="logging in...">
              log in
            </AuthSubmitButton>
          </form>

          <p className="page-link-note">
            New here? <Link href={ROUTES.signup}>Create an account.</Link>
          </p>
        </section>

        <AuthArtwork mode="login" />
      </div>
    </main>
  );
}
