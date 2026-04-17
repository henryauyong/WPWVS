import { useLoaderData } from "react-router";
import { ProtectedLayout } from "../components/ProtectedLayout";
import { FolderView } from "../components/FolderView";

const API_URL = import.meta.env.VITE_API_URL;

export async function clientLoader() {
  const token = localStorage.getItem("token");
  if (!token) throw new Error("Unauthorized");

  const res = await fetch(`${API_URL}/users/me/favorites`, {
    headers: { Authorization: `Bearer ${token}` },
  });

  if (res.status === 401) {
    localStorage.removeItem("token");
    localStorage.removeItem("user");
    window.location.href = "/login";
    return null;
  }

  if (!res.ok) throw new Error("Failed to fetch favorites");
  const data = await res.json();
  // Transform favorites list into Item list compatible with FolderView
  return data.map((fav: any) => fav.file);
}

export default function FavoritesPage() {
  const files = useLoaderData() as any[];

  if (!files) return null;

  return (
    <ProtectedLayout>
      <FolderView 
        folderName="My Favorites" 
        children={files} 
      />
    </ProtectedLayout>
  );
}
