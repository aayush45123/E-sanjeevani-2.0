// Custom hook to handle authentication checks and redirects
import { useNavigate } from "react-router-dom";

export const useAuthGuard = () => {
  const navigate = useNavigate();

  const checkAuthAndNavigate = (targetPath) => {
    try {
      // With httpOnly cookies, presence of token isn't reliable in localStorage.
      // Let the /me endpoint decide.
      navigate(targetPath);
      return true;
    } catch {
      navigate("/auth");
      return false;
    }
  };

  const isUserLoggedIn = () => {
    // Cookies are httpOnly; cannot be read from JS.
    // Treat as logged out; protected routes should rely on server 401 redirects.
    return false;
  };

  return { checkAuthAndNavigate, isUserLoggedIn };
};
