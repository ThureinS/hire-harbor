import { Navigate, useLocation } from "react-router-dom";
import { Fragment } from "react";
import { useSession, useUser } from "@clerk/clerk-react";

const ProtectedRoute = ({ children }) => {
  const { isSignedIn, isLoaded, user } = useUser();
  const { session, isLoaded: sessionLoaded } = useSession();
  const { pathname } = useLocation();

  if (!isLoaded || !sessionLoaded) return <p role="status" className="p-6">Loading your account…</p>;

  if (!isSignedIn) {
    return <Navigate to="/?sign-in=true" />;
  }

  if (!session || session.user.id !== user?.id)
    return <p role="status" className="p-6">Loading your account…</p>;

  if (!user?.unsafeMetadata?.role && pathname !== "/onboarding")
    return <Navigate to="/onboarding" />;

  return <Fragment key={`${session.id}:${user.id}`}>{children}</Fragment>;
};

export default ProtectedRoute;
