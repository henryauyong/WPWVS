import { type RouteConfig, index, route } from "@react-router/dev/routes";

export default [
  index("routes/home.tsx"),
  route("login", "routes/login.tsx"),
  route("folder/:folderSlug", "routes/folder.tsx"),
  route("favorites", "routes/favorites.tsx"),
] satisfies RouteConfig;
