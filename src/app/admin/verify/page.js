import { redirect } from "next/navigation";
import AuthSubmitButton from "../../../components/AuthSubmitButton";
import Icon from "../../../components/Icon";
import { ROUTES } from "../../../constants/routes";
import { hasVerifiedAdminAccess } from "../../../lib/adminAccess";
import { requireAdminUser } from "../../../lib/auth";
import { verifyAdminAccess } from "./actions";

export const metadata = {
  title: "Verify admin access",
};

export default async function AdminVerifyPage({ searchParams }) {
  const params = await searchParams;
  const { claims } = await requireAdminUser();

  if (await hasVerifiedAdminAccess(claims)) {
    redirect(ROUTES.admin);
  }

  const error = typeof params?.error === "string" ? params.error : "";

  return (
    <main className="admin-verify-page">
      <section className="admin-verify-card">
        <div className="admin-verify-icon">
          <Icon name="shield" size={25} />
        </div>
        <p className="eyebrow">restricted admin access</p>
        <h1>verify it is you.</h1>
        <p className="admin-verify-description">
          Re-enter your account password before opening private submissions.
          Verified access lasts for fifteen minutes on this session.
        </p>

        <form className="auth-form" action={verifyAdminAccess}>
          <div className="auth-field">
            <label htmlFor="adminPassword">account password</label>
            <input
              id="adminPassword"
              name="password"
              type="password"
              autoComplete="current-password"
              autoFocus
              required
            />
          </div>

          {error ? (
            <p className="auth-message auth-error" role="alert">
              {error}
            </p>
          ) : null}

          <AuthSubmitButton pendingText="verifying...">
            enter admin workspace
          </AuthSubmitButton>
        </form>

        <p className="admin-verify-note">
          This page is available only to accounts marked as admin in the
          database.
        </p>
      </section>
    </main>
  );
}
