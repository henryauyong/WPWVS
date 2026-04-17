import { useLoaderData } from "react-router";
import { ProtectedLayout } from "../components/ProtectedLayout";
import { FolderView } from "../components/FolderView";

const API_URL = import.meta.env.VITE_API_URL;

export async function clientLoader({ request }: { request: Request }) {
  const token = localStorage.getItem("token");
  if (!token) return { folder: { name: "Root" }, children: [] };

  const res = await fetch(`${API_URL}/files/folder/0`, {
    headers: { Authorization: `Bearer ${token}` },
  });

  if (res.status === 401) {
    localStorage.removeItem("token");
    localStorage.removeItem("user");
    window.location.href = "/login";
    return null;
  }

  if (!res.ok) throw new Error("Failed to fetch root folder");
  return res.json();
}

export default function Home() {
  const data = useLoaderData() as any;

  if (!data) return null;

  return (
    <ProtectedLayout>
      <FolderView 
        folderName="My Library" 
        children={data.children} 
      />
    </ProtectedLayout>
  );
}
