import { useEffect, useState } from "react";
import { Link, NavLink, useSearchParams } from "react-router-dom";
import {
  SignedIn,
  SignedOut,
  UserButton,
  SignIn,
  useUser,
} from "@clerk/clerk-react";
import { Button } from "./ui/button";
import { BriefcaseBusiness, Heart, LogIn, PenBox } from "lucide-react";

const navLinkClass = ({ isActive }) =>
  [
    "rounded-md px-3 py-2 text-sm font-semibold transition-colors",
    isActive
      ? "bg-primary/10 text-primary"
      : "text-muted-foreground hover:bg-accent hover:text-accent-foreground",
  ].join(" ");

const Header = () => {
  const [showSignIn, setShowSignIn] = useState(false);
  const [search, setSearch] = useSearchParams();
  const { user } = useUser();

  useEffect(() => {
    if (search.get("sign-in")) setShowSignIn(true);
  }, [search]);

  const handleOverlayClick = (e) => {
    if (e.target === e.currentTarget) {
      setShowSignIn(false);
      setSearch({});
    }
  };

  return (
    <>
      <nav className="sticky top-0 z-40 flex items-center gap-4 border-b border-border bg-background/95 px-4 py-3 backdrop-blur supports-[backdrop-filter]:bg-background/80 sm:px-0">
        <Link to="/" className="flex items-center gap-3">
          <img src="/logo.png" className="h-12 w-auto" alt="Hire Harbor" />
        </Link>

        <div className="hidden items-center gap-1 md:flex">
          <NavLink to="/" className={navLinkClass}>
            Home
          </NavLink>
          <NavLink to="/jobs" className={navLinkClass}>
            Find Jobs
          </NavLink>
        </div>

        <div className="ml-auto flex items-center gap-2 sm:gap-3">
          <SignedOut>
            <Button
              variant="outline"
              className="border-border bg-card/70 font-semibold hover:-translate-y-0.5 hover:border-primary/40 hover:bg-accent"
              onClick={() => setShowSignIn(true)}
            >
              <LogIn size={18} className="mr-2" />
              Login
            </Button>
          </SignedOut>

          <SignedIn>
            {user?.unsafeMetadata?.role === "recruiter" && (
              <Button asChild className="font-bold shadow-[0_10px_30px_-18px_var(--primary)]">
                <Link to="/post-job">
                  <PenBox size={18} className="mr-2" />
                  Post a Job
                </Link>
              </Button>
            )}

            <UserButton
              appearance={{
                elements: { avatarBox: "h-10 w-10 rounded-md" },
              }}
            >
              <UserButton.MenuItems>
                <UserButton.Link
                  label="My Jobs"
                  labelIcon={<BriefcaseBusiness size={15} />}
                  href="/my-jobs"
                />
                <UserButton.Link
                  label="Saved Jobs"
                  labelIcon={<Heart size={15} />}
                  href="/saved-jobs"
                />
                <UserButton.Action label="manageAccount" />
              </UserButton.MenuItems>
            </UserButton>
          </SignedIn>
        </div>
      </nav>

      {showSignIn && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-background/80 p-4 backdrop-blur-sm"
          onClick={handleOverlayClick}
        >
          <SignIn
            signUpForceRedirectUrl="/onboarding"
            fallbackRedirectUrl="/onboarding"
          />
        </div>
      )}
    </>
  );
};

export default Header;
