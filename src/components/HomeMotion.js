"use client";

import { useEffect, useState } from "react";

export default function HomeMotion() {
  const [showIntro, setShowIntro] = useState(true);

  useEffect(() => {
    const revealItems = document.querySelectorAll("[data-reveal]");
    const root = document.documentElement;
    const reduceMotion = window.matchMedia(
      "(prefers-reduced-motion: reduce)"
    ).matches;
    const introFallback = window.setTimeout(() => setShowIntro(false), 2600);

    root.classList.add("motion-ready");

    if (reduceMotion || !("IntersectionObserver" in window)) {
      revealItems.forEach((item) => item.classList.add("is-visible"));
      return () => {
        window.clearTimeout(introFallback);
        root.classList.remove("motion-ready");
      };
    }

    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            entry.target.classList.add("is-visible");
            observer.unobserve(entry.target);
          }
        });
      },
      {
        threshold: 0.14,
        rootMargin: "0px 0px -8% 0px",
      }
    );

    revealItems.forEach((item) => observer.observe(item));

    return () => {
      window.clearTimeout(introFallback);
      observer.disconnect();
      root.classList.remove("motion-ready");
    };
  }, []);

  if (!showIntro) {
    return null;
  }

  return (
    <div
      className="home-intro"
      aria-hidden="true"
      onAnimationEnd={(event) => {
        if (event.animationName === "intro-leave") {
          setShowIntro(false);
        }
      }}
    >
      <div className="intro-grain" />
      <div className="intro-title">
        <span className="intro-frame-mark">
          <span />
        </span>
        <div className="intro-wordmark-row">
          <span className="intro-line intro-line-left" />
          <p>one line frames</p>
          <span className="intro-line intro-line-right" />
        </div>
        <small>ordinary moments, kept gently</small>
      </div>
    </div>
  );
}
