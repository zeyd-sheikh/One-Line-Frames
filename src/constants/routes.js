export const ROUTES = Object.freeze({
  home: "/",
  gallery: "/gallery",
  submit: "/submit",
  about: "/about",
  privacy: "/privacy",
  login: "/login",
  signup: "/signup",
  authConfirm: "/auth/confirm",
  profile: "/profile",
  profileSubmissions: "/profile/submissions",
  admin: "/admin",
  adminVerify: "/admin/verify",
});

export const PRIMARY_NAV_ITEMS = Object.freeze([
  { href: ROUTES.home, label: "home" },
  { href: ROUTES.gallery, label: "gallery" },
  { href: ROUTES.submit, label: "send a moment" },
  { href: ROUTES.about, label: "about" },
]);
