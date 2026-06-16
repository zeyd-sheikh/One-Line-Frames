import Link from "next/link";
import { redirect } from "next/navigation";
import AuthArtwork from "../../components/AuthArtwork";
import AuthSubmitButton from "../../components/AuthSubmitButton";
import Icon from "../../components/Icon";
import { ROUTES } from "../../constants/routes";
import { getAuthenticatedUser } from "../../lib/auth";
import { resetPassword } from "../auth/actions";

export const metadata = {
  title: "Choose a new password",
};

export default async function ResetPasswordPage({ searchParams }) {
  const [{ claims }, params] = await Promise.all([
    getAuthenticatedUser(),
    searchParams,
  ]);

  if (!claims) {
    redirect(
      `${ROUTES.login}?error=${encodeURIComponent(
        "Use the password reset link from your email before choosing a new password."
      )}`
    );
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
            <p className="eyebrow">new password</p>
            <h1>choose something sturdy.</h1>
            <p>
              After saving, you&apos;ll be signed out and can log in again with
              the new password.
            </p>
          </div>

          <form className="auth-form" action={resetPassword}>
            <div className="auth-field-row">
              <div className="auth-field">
                <label htmlFor="password">new password</label>
                <input
                  id="password"
                  name="password"
                  type="password"
                  autoComplete="new-password"
                  placeholder="8+ characters"
                  minLength={8}
                  required
                />
              </div>

              <div className="auth-field">
                <label htmlFor="confirmPassword">confirm password</label>
                <input
                  id="confirmPassword"
                  name="confirmPassword"
                  type="password"
                  autoComplete="new-password"
                  placeholder="repeat password"
                  minLength={8}
                  required
                />
              </div>
            </div>

            {error ? (
              <p className="auth-message auth-error" role="alert">
                {error}
              </p>
            ) : null}
            {message ? (
              <p className="auth-message auth-success">{message}</p>
            ) : null}

            <AuthSubmitButton pendingText="saving password...">
              save new password
            </AuthSubmitButton>
          </form>

          <p className="page-link-note">
            Link expired?{" "}
            <Link href={ROUTES.forgotPassword}>Request a new one.</Link>
          </p>
        </section>

        <AuthArtwork mode="login" />
      </div>
    </main>
  );
}
