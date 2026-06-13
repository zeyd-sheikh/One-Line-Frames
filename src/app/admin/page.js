import FoundationPanel from "../../components/FoundationPanel";
import Icon from "../../components/Icon";
import PageIntro from "../../components/PageIntro";
import { notFound } from "next/navigation";
import { requireAuthenticatedUser } from "../../lib/auth";

export const metadata = {
  title: "Admin",
};

export default async function AdminPage() {
  const { supabase, claims } = await requireAuthenticatedUser();
  const { data: profile } = await supabase
    .from("profiles")
    .select("role")
    .eq("id", claims.sub)
    .maybeSingle();

  if (profile?.role !== "admin") {
    notFound();
  }

  return (
    <main className="page-shell page-shell-wide">
      <div className="admin-heading-row">
        <PageIntro
          eyebrow="restricted moderation area"
          title="admin workspace"
          description="Authorized moderators will use this private workspace. Every action must remain attributable to the person who performed it."
        />
        <div className="admin-badge">
          <Icon name="shield" size={17} />
          verified admin
        </div>
      </div>

      <div className="admin-stats">
        <article>
          <span>00</span>
          <p>pending review</p>
        </article>
        <article>
          <span>00</span>
          <p>open appeals</p>
        </article>
        <article>
          <span>00</span>
          <p>removal requests</p>
        </article>
        <article>
          <Icon name="check" size={25} />
          <p>all quiet</p>
        </article>
      </div>

      <div className="panel-grid panel-grid-three">
        <FoundationPanel
          eyebrow="queue"
          icon="camera"
          title="Review queue"
          description="Review pending submissions, inspect the original image, and approve or reject publication."
        />
        <FoundationPanel
          eyebrow="moderation"
          icon="journal"
          title="Editable details"
          description="Admins may change captions, categories, tags, frames, and moderation reasons, but never replace the uploaded photo."
        />
        <FoundationPanel
          eyebrow="accountability"
          icon="shield"
          title="Audit history"
          description="Every edit and decision will record the admin, reason, old value, new value, and timestamp."
        />
      </div>

      <FoundationPanel
        eyebrow="later phase"
        icon="sparkle"
        title="Later moderation workflows"
        description="This area will also handle one-time rejection appeals, removal requests, category and frame management, and featured content."
      />
    </main>
  );
}
