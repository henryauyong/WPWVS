import { type RouteConfig, index, route, layout } from "@react-router/dev/routes";

export default [
  route("login", "routes/login.tsx"),

  layout("layouts/MainLayout.tsx", [
    index("routes/home.tsx"),
    route("folder/:folderSlug", "routes/folder.tsx"),
    route("favorites", "routes/favorites.tsx"),
  ]),

  route("*", "routes/NotFound.tsx")
] satisfies RouteConfig;
