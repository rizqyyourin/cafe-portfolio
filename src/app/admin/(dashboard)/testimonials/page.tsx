import { createTestimonial, deleteTestimonial, updateTestimonial } from "@/actions/admin-testimonials";
import { TestimonialsView } from "@/components/admin/testimonials-view";
import { getTestimonialsPageData } from "@/db/testimonials";

export const dynamic = "force-dynamic";

export default async function AdminTestimonialsPage() {
  const data = await getTestimonialsPageData();
  return <TestimonialsView createTestimonialAction={createTestimonial} data={data} deleteTestimonialAction={deleteTestimonial} updateTestimonialAction={updateTestimonial} />;
}
