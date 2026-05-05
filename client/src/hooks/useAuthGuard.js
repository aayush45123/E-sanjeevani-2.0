// Custom hook to handle authentication checks and redirects
import { useNavigate } from "react-router-dom";

export const useAuthGuard = () => {
  const navigate = useNavigate();

  const checkAuthAndNavigate = (targetPath) => {
    const token = localStorage.getItem("token");

    if (!token) {
      // Redirect to auth if not logged in
      navigate("/auth");
      return false;
    }

    // If logged in, navigate to target path
    navigate(targetPath);
    return true;
  };

  const isUserLoggedIn = () => {
    return !!localStorage.getItem("token");
  };

  return { checkAuthAndNavigate, isUserLoggedIn };
};
