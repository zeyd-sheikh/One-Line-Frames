import PageIntro from "../../components/PageIntro";

export const metadata = {
  title: "About",
};

export default function AboutPage() {
  return (
    <main className="page-shell">
      <PageIntro
        eyebrow="why this exists"
        title="a quieter way to share"
        description="One Line Frames is a student-focused gallery for ordinary moments that deserve a little attention."
      />

      <div className="prose-grid">
        <section>
          <h2>one photo</h2>
          <p>
            A library corner, a late bus, rain on campus, or anything else that
            felt worth keeping.
          </p>
        </section>
        <section>
          <h2>one line</h2>
          <p>
            A short reflection in the student&apos;s own voice, without the
            pressure to perform for a feed.
          </p>
        </section>
        <section>
          <h2>carefully reviewed</h2>
          <p>
            Every submission is moderated before it becomes public. There are
            no likes, follower counts, or public comments.
          </p>
        </section>
      </div>
    </main>
  );
}
