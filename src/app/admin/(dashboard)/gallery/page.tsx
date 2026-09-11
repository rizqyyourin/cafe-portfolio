import { createGalleryImage, deleteGalleryImage, updateGalleryImage } from "@/actions/admin-gallery";
import { GalleryView } from "@/components/admin/gallery-view";
import { getGalleryPageData } from "@/db/gallery";

export const dynamic = "force-dynamic";

export default async function AdminGalleryPage() {
  const data = await getGalleryPageData();
  return <GalleryView createGalleryImageAction={createGalleryImage} data={data} deleteGalleryImageAction={deleteGalleryImage} updateGalleryImageAction={updateGalleryImage} />;
}
