import Navbar from "../../components/Navbar";
import Footer from "../../components/Footer";
import SubmitForm from "../../components/SubmitForm";

export default function SubmitPage() {
  return (
    <main>
      <Navbar activePage="submit" />

      <section className="page-shell submit-page">
        <div className="page-heading">
          <h1>send a moment</h1>
          <p>
            one photo, one line. that&apos;s the whole thing.
            <br />
            submissions are reviewed before they go up.
          </p>
        </div>

        <SubmitForm />
      </section>

      <Footer />
    </main>
  );
}