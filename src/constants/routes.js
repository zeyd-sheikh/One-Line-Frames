export const ROUTES = Object.freeze({
  home: "/",
  submit: "/submit",
  about: "/about",
  privacy: "/privacy",
  login: "/login",
  signup: "/signup",
  profile: "/profile",
  admin: "/admin",
});

export const PRIMARY_NAV_ITEMS = Object.freeze([
  { href: ROUTES.home, label: "moments" },
  { href: ROUTES.submit, label: "send a moment" },
  { href: ROUTES.about, label: "about" },
]);

export const ACCOUNT_NAV_ITEMS = Object.freeze([
  { href: ROUTES.login, label: "log in" },
  { href: ROUTES.profile, label: "profile" },
]);
