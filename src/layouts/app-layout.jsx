import Header from "@/components/header";
import { Outlet } from "react-router-dom";
import { Suspense } from "react";
import { BarLoader } from "react-spinners";

const AppLayout = () => {
  return (
    <div className="min-h-screen bg-background text-foreground">
      <main className="min-h-screen container mx-auto">
        <Header />
        <Suspense fallback={<BarLoader width={"100%"} color="var(--primary)" />}>
          <Outlet />
        </Suspense>
      </main>
      <div className="mt-10 border-t border-border bg-card p-5 text-center text-sm text-muted-foreground">
        Built by Thurein Soe
      </div>
    </div>
  );
};

export default AppLayout;
