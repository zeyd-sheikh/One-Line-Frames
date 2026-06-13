import Link from "next/link";
import { redirect } from "next/navigation";
import AuthArtwork from "../../components/AuthArtwork";
import AuthSubmitButton from "../../components/AuthSubmitButton";
import Icon from "../../components/Icon";
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
    <main className="auth-page">
      <div className="auth-layout auth-layout-signup">
        <section className="auth-content">
          <div className="auth-heading">
            <div className="auth-heading-icon">
              <Icon name="camera" size={18} />
            </div>
            <p className="eyebrow">make a little space</p>
            <h1>start noticing.</h1>
            <p>
              Anyone with an email can join. Confirm it once, then your future
              moments have a home.
            </p>
          </div>

          <form className="auth-form" action={signup}>
            <div className="auth-field">
              <label htmlFor="displayName">display name</label>
              <input
                id="displayName"
                name="displayName"
                type="text"
                autoComplete="name"
                placeholder="optional"
                maxLength={80}
              />
              <small>
                Your default public name. You can add or change it later.
              </small>
            </div>

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

            <div className="auth-field-row">
              <div className="auth-field">
                <label htmlFor="password">password</label>
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

            <AuthSubmitButton pendingText="creating account...">
              create account
            </AuthSubmitButton>
          </form>

          <p className="page-link-note">
            Already registered? <Link href={ROUTES.login}>Log in.</Link>
          </p>
        </section>

        <AuthArtwork mode="signup" />
      </div>
    </main>
  );
}
