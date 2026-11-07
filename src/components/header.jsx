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
import { BriefcaseBusiness, Heart, LogIn, PenBox, Sparkles } from "lucide-react";
import DemoAccessCard from "./demo-access-card";

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

  const isDemoUser = Boolean(
    user?.primaryEmailAddress?.emailAddress?.includes("demo") ||
      user?.primaryEmailAddress?.emailAddress?.endsWith("@hireharbor.dev")
  );

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
              className="border-primary/40 bg-primary/10 text-primary font-semibold hover:-translate-y-0.5 hover:bg-primary/20"
              onClick={() => setShowSignIn(true)}
            >
              <Sparkles size={16} className="mr-1.5" />
              Demo Access
            </Button>

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

            <div data-demo-user={isDemoUser ? "true" : undefined}>
              <UserButton
                appearance={{
                  elements: {
                    avatarBox: "h-10 w-10 rounded-md",
                    userButtonPopoverActionButton__manageAccount: isDemoUser
                      ? "!hidden pointer-events-none"
                      : "",
                    profileSection__danger: isDemoUser
                      ? "!hidden pointer-events-none"
                      : "",
                  },
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
                  {!isDemoUser && <UserButton.Action label="manageAccount" />}
                </UserButton.MenuItems>
              </UserButton>
            </div>
          </SignedIn>
        </div>
      </nav>

      {showSignIn && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center overflow-y-auto bg-background/85 p-4 backdrop-blur-sm"
          onClick={handleOverlayClick}
        >
          <div
            className="relative my-auto flex w-full max-w-4xl flex-col items-center justify-center gap-6 p-2 lg:flex-row lg:items-start"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="w-full max-w-md">
              <DemoAccessCard
                compact
                onLoginSuccess={() => {
                  setShowSignIn(false);
                  setSearch({});
                }}
              />
            </div>
            <div className="flex w-full max-w-md justify-center">
              <SignIn
                signUpForceRedirectUrl="/onboarding"
                fallbackRedirectUrl="/onboarding"
              />
            </div>
          </div>
        </div>
      )}
    </>
  );
};

export default Header;
