import Link from "next/link";
import FoundationPanel from "../../components/FoundationPanel";
import PageIntro from "../../components/PageIntro";
import { ROUTES } from "../../constants/routes";

export const metadata = {
  title: "Log in",
};

export default function LoginPage() {
  return (
    <main className="page-shell page-shell-narrow">
      <PageIntro
        eyebrow="account access"
        title="log in"
        description="Accounts will use email and password. Verified email will be required before a user can submit a moment."
      />

      <FoundationPanel
        title="Account access is not active yet"
        description="Authentication will be connected after the database and security policies are in place."
        items={[
          "email and password sign-in",
          "email verification",
          "password reset",
          "secure session handling",
        ]}
      />

      <p className="page-link-note">
        New here? <Link href={ROUTES.signup}>View the planned sign-up page.</Link>
      </p>
    </main>
  );
}
