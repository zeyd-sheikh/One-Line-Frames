import Link from "next/link";
import { redirect } from "next/navigation";
import AuthArtwork from "../../components/AuthArtwork";
import AuthSubmitButton from "../../components/AuthSubmitButton";
import Icon from "../../components/Icon";
import { ROUTES } from "../../constants/routes";
import { getAuthenticatedUser } from "../../lib/auth";
import { requestPasswordReset } from "../auth/actions";

export const metadata = {
  title: "Reset password",
};

export default async function ForgotPasswordPage({ searchParams }) {
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
              <Icon name="shield" size={18} />
            </div>
            <p className="eyebrow">account recovery</p>
            <h1>reset your password.</h1>
            <p>
              Enter your email and we&apos;ll send a private reset link if the
              account exists.
            </p>
          </div>

          <form className="auth-form" action={requestPasswordReset}>
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

            {error ? (
              <p className="auth-message auth-error" role="alert">
                {error}
              </p>
            ) : null}
            {message ? (
              <p className="auth-message auth-success">{message}</p>
            ) : null}

            <AuthSubmitButton pendingText="sending reset link...">
              send reset link
            </AuthSubmitButton>
          </form>

          <p className="page-link-note">
            Remembered it? <Link href={ROUTES.login}>Log in.</Link>
          </p>
        </section>

        <AuthArtwork mode="login" />
      </div>
    </main>
  );
}
