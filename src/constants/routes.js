export const ROUTES = Object.freeze({
  home: "/",
  submit: "/submit",
  about: "/about",
  privacy: "/privacy",
  login: "/login",
  signup: "/signup",
  authConfirm: "/auth/confirm",
  profile: "/profile",
  admin: "/admin",
});

export const PRIMARY_NAV_ITEMS = Object.freeze([
  { href: ROUTES.home, label: "moments" },
  { href: ROUTES.submit, label: "send a moment" },
  { href: ROUTES.about, label: "about" },
]);
