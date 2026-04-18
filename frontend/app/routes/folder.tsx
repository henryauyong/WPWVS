import { useLoaderData, useParams } from "react-router";
import { ProtectedLayout } from "../components/ProtectedLayout";
import { FolderView } from "../components/FolderView";
import { apiClient } from "~/utils/apiClient";

export async function clientLoader({ params }: { params: any }) {
  const slug = params.folderSlug;
  // Extract ID from "id-name"
  const id = slug.split("-")[0];

  const res = await apiClient(`/files/folder/${id}`)
  return res
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
