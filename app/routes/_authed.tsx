import { createFileRoute, redirect, Outlet } from "@tanstack/react-router";

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
  return <Outlet />;
}
