import { Outlet, createRootRoute, createRoute } from "@tanstack/react-router";

import { AppHome } from "./index";
import { TypographyAnimation } from "./typography-animation";

function RootLayout(): React.JSX.Element {
  return <Outlet />;
}

const rootRoute = createRootRoute({
  component: RootLayout,
});

const indexRoute = createRoute({
  component: AppHome,
  getParentRoute: () => rootRoute,
  path: "/",
});

const typographyRoute = createRoute({
  component: TypographyAnimation,
  getParentRoute: () => rootRoute,
  path: "/typography",
});

export const routeTree = rootRoute.addChildren([indexRoute, typographyRoute]);
