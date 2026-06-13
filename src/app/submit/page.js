import Icon from "../../components/Icon";
import PageIntro from "../../components/PageIntro";
import SubmissionForm from "../../components/SubmissionForm";
import { requireAuthenticatedUser } from "../../lib/auth";

export const metadata = {
  title: "Send a moment",
};

export default async function SubmitPage() {
  const { supabase, claims } = await requireAuthenticatedUser();
  const [{ data: profile }, { data: categories }] = await Promise.all([
    supabase
      .from("profiles")
      .select("display_name, accepted_terms")
      .eq("id", claims.sub)
      .maybeSingle(),
    supabase
      .from("categories")
      .select("id, name, description")
      .eq("is_active", true)
      .order("sort_order"),
  ]);

  return (
    <main className="page-shell page-shell-wide submit-page">
      <div className="submit-heading-row">
        <PageIntro
          eyebrow="submission workspace"
          title="send a moment"
          description="One photo, one short line, and a few choices about how it should appear. Every submission rests privately in review first."
        />
        <div className="submit-promise">
          <Icon name="shield" size={18} />
          <span>private until approved</span>
        </div>
      </div>

      <SubmissionForm
        categories={categories ?? []}
        userId={claims.sub}
        profileDisplayName={profile?.display_name ?? ""}
        acceptedTerms={Boolean(profile?.accepted_terms)}
      />
    </main>
  );
}
