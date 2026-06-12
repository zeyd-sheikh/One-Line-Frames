import Link from "next/link";
import FoundationPanel from "../../components/FoundationPanel";
import PageIntro from "../../components/PageIntro";
import { ROUTES } from "../../constants/routes";

export const metadata = {
  title: "Create an account",
};

export default function SignupPage() {
  return (
    <main className="page-shell page-shell-narrow">
      <PageIntro
        eyebrow="account access"
        title="create an account"
        description="Anyone with an email address will be able to register. The platform is designed for UTSC and other college or university students."
      />

      <FoundationPanel
        title="Registration is not active yet"
        description="The account flow will be enabled once profiles, email verification, and terms acceptance are backed by Row Level Security."
        items={[
          "email and password",
          "default profile display name",
          "email verification",
          "terms acceptance before submitting",
        ]}
      />

      <p className="page-link-note">
        Already registered? <Link href={ROUTES.login}>Return to log in.</Link>
      </p>
    </main>
  );
}
