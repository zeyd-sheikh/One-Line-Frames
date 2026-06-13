import MomentGallery from "../../components/MomentGallery";
import PageIntro from "../../components/PageIntro";
import { getApprovedSubmissions } from "../../services/submissions";

export const metadata = {
  title: "Gallery",
  description:
    "Browse approved student moments without likes, rankings, or pressure.",
};

export default async function GalleryPage() {
  const submissions = await getApprovedSubmissions();

  return (
    <main className="gallery-page">
      <header className="gallery-page-intro">
        <PageIntro
          eyebrow="the public wall"
          title="take your time here."
          description="Every approved moment lives here. Search by a feeling, filter by category, change the layout, or let the wall surprise you."
        />
        <div className="gallery-page-note">
          <span>{submissions.length}</span>
          <p>
            moments currently resting on the wall, with no scores attached.
          </p>
        </div>
      </header>

      <MomentGallery submissions={submissions} />
    </main>
  );
}
