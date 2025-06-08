import type { ReactNode } from "react";
import {
  Outlet,
  createRootRoute,
  HeadContent,
  Scripts,
} from "@tanstack/react-router";
import appCss from "@/styles/app.css?url";
import { createServerFn } from "@tanstack/react-start";
import { useAppSession } from "@/lib/session";
import { DefaultCatchBoundary } from "@/components/DefaultCatchBoundary";
import { NotFound } from "@/components/NotFound";

const fetchUser = createServerFn({ method: "GET" }).handler(async () => {
  const session = await useAppSession();

  if (!session.data.userId) {
    console.log("No user found");
    return null;
  }

  console.log("User found");

  return {
    userId: session.data.userId,
    username: session.data.username,
  };
});

export const Route = createRootRoute({
  head: () => ({
    meta: [
      {
        charSet: "utf-8",
      },
      {
        name: "viewport",
        content: "width=device-width, initial-scale=1",
      },
      {
        title: "Max Programming - Image Viewer",
      },
    ],
    links: [
      {
        rel: "stylesheet",
        href: appCss,
      },
    ],
  }),
  async beforeLoad() {
    const user = await fetchUser();
    return { user };
  },
  errorComponent: props => {
    return (
      <RootDocument>
        <DefaultCatchBoundary {...props} />
      </RootDocument>
    );
  },
  notFoundComponent: () => <NotFound />,
  component: RootComponent,
});

function RootComponent() {
  return (
    <RootDocument>
      <Outlet />
    </RootDocument>
  );
}

function RootDocument({ children }: Readonly<{ children: ReactNode }>) {
  return (
    <html>
      <head>
        <HeadContent />
      </head>
      <body>
        {children}
        <Scripts />
      </body>
    </html>
  );
}
