export const getCookieSettings = () => {
  const isProduction = process.env.NODE_ENV === "production";

  return {
    httpOnly: true,
    secure: isProduction,
    sameSite: process.env.COOKIE_SAMESITE || "lax",
    path: "/",
  };
};
