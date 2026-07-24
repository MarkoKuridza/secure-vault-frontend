import { CircularProgress } from "@mui/material";
import { useEffect } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";

function OAuth2Callback() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();

  useEffect(() => {
    const tempToken = searchParams.get("tempToken");
    const isNewUser = searchParams.get("isNewUser") === "true";

    if (!tempToken) {
      navigate("/login");
      return;
    }

    sessionStorage.setItem("tempToken", tempToken);
    sessionStorage.setItem("isOAuth2", "true");

    if (isNewUser) {
      navigate("/mfa/setup");
    } else {
      navigate("/login?oauth2=true");
    }
  }, []);

  return <CircularProgress />;
}

export default OAuth2Callback;
