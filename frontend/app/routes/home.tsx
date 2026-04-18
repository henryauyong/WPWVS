import { useLoaderData } from "react-router";
import { ProtectedLayout } from "~/components/ProtectedLayout";
import { FolderView } from "~/components/FolderView";
import { apiClient } from "~/utils/apiClient";

const API_URL = import.meta.env.VITE_API_URL;

export async function clientLoader({ request }: { request: Request }) {
  const res = await apiClient("/files/folder/0")
  return res
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
