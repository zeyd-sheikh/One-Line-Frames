import Icon from "./Icon";

export default function AuthArtwork({ mode = "login" }) {
  const isSignup = mode === "signup";

  return (
    <aside className={`auth-artwork auth-artwork-${mode}`}>
      <div className="auth-art-orb auth-art-orb-one" />
      <div className="auth-art-orb auth-art-orb-two" />

      <div className="auth-postcard">
        <div className="auth-postcard-image">
          <div className="moment-art moment-art-library" aria-hidden="true">
            <span className="moment-art-sun" />
            <span className="moment-art-horizon" />
            <span className="moment-art-shape moment-art-shape-one" />
            <span className="moment-art-shape moment-art-shape-two" />
            <span className="moment-art-grain" />
          </div>
        </div>
        <p>
          {isSignup
            ? "made an account for the things i usually forget."
            : "came back to see what everyone noticed."}
        </p>
        <span>{isSignup ? "a future moment" : "welcome back"}</span>
      </div>

      <div className="auth-art-note">
        <Icon name={isSignup ? "camera" : "sparkle"} size={17} />
        <span>{isSignup ? "your first frame starts here" : "your wall is waiting"}</span>
      </div>
    </aside>
  );
}
