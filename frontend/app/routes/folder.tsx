import { useLoaderData, useParams } from "react-router";
import { ProtectedLayout } from "../components/ProtectedLayout";
import { FolderView } from "../components/FolderView";

const API_URL = import.meta.env.VITE_API_URL;

export async function clientLoader({ params }: { params: any }) {
  const token = localStorage.getItem("token");
  if (!token) throw new Error("Unauthorized");

  const slug = params.folderSlug;
  // Extract ID from "id-name"
  const id = slug.split("-")[0];

  const res = await fetch(`${API_URL}/files/folder/${id}`, {
    headers: { Authorization: `Bearer ${token}` },
  });

  if (res.status === 401) {
    localStorage.removeItem("token");
    localStorage.removeItem("user");
    window.location.href = "/login";
    return null;
  }

  if (!res.ok) throw new Error("Failed to fetch folder");
  return res.json();
}

export default function FolderPage() {
  const data = useLoaderData() as any;

  if (!data) return null;

  return (
    <ProtectedLayout>
      <FolderView 
        folderName={data.folder.name} 
        children={data.children} 
      />
    </ProtectedLayout>
  );
}
