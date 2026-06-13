import Link from "next/link";
import { redirect } from "next/navigation";
import AuthSubmitButton from "../../components/AuthSubmitButton";
import PageIntro from "../../components/PageIntro";
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
    <main className="page-shell page-shell-narrow">
      <PageIntro
        eyebrow="account access"
        title="log in"
        description="Return to your private profile to manage submissions and moderation updates."
      />

      <form className="auth-form" action={login}>
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
            autoComplete="current-password"
            required
          />
        </div>

        {error ? (
          <p className="auth-message auth-error" role="alert">
            {error}
          </p>
        ) : null}
        {message ? <p className="auth-message auth-success">{message}</p> : null}

        <AuthSubmitButton pendingText="logging in...">
          log in
        </AuthSubmitButton>
      </form>

      <p className="page-link-note">
        New here? <Link href={ROUTES.signup}>Create an account.</Link>
      </p>
    </main>
  );
}
