import { createCategory, deleteCategory, updateCategory } from "@/actions/admin-categories";
import { CategoriesView } from "@/components/admin/categories-view";
import { getCategoriesPageData } from "@/db/categories";

export const dynamic = "force-dynamic";

export default async function AdminCategoriesPage() {
  const data = await getCategoriesPageData();
  return <CategoriesView createCategoryAction={createCategory} data={data} deleteCategoryAction={deleteCategory} updateCategoryAction={updateCategory} />;
}
