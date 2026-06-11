import "./globals.css";

export const metadata = {
  title: "One Line Frames",
  description: "A quiet space for students to share photos and one-line reflections.",
};

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}