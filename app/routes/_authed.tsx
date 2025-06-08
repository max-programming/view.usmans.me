import {
  createFileRoute,
  redirect,
  Outlet,
  useRouteContext,
} from "@tanstack/react-router";
import { LogoutButton } from "@/components/LogoutButton";

export const Route = createFileRoute("/_authed")({
  beforeLoad({ context }) {
    if (!context.user) {
      console.log("Not authenticated, redirecting to login");
      throw redirect({ to: "/login" });
    }
  },
  component: AuthedLayout,
});

function AuthedLayout() {
  const { user } = useRouteContext({ from: "/_authed" });

  return (
    <div className="min-h-screen bg-background">
      <header className="border-b bg-card">
        <div className="container mx-auto px-6 py-4">
          <div className="flex justify-between items-center">
            <div className="flex items-center gap-4">
              <h1 className="text-xl font-semibold">Image Viewer</h1>
              {user && (
                <div className="text-sm text-muted-foreground">
                  Welcome, {user.username}
                </div>
              )}
            </div>
            <LogoutButton />
          </div>
        </div>
      </header>
      <main>
        <Outlet />
      </main>
    </div>
  );
}
