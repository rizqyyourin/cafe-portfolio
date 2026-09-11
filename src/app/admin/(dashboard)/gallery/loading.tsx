export default function AdminGalleryLoading() {
  return <div aria-label="Loading gallery" className="animate-pulse space-y-8" role="status"><div className="h-24 max-w-2xl rounded-md bg-[#e9e0d3]" /><div className="h-14 max-w-2xl rounded-md bg-[#e9e0d3]" /><div className="grid min-h-[34rem] gap-5 sm:grid-cols-2 xl:grid-cols-4">{[1, 2, 3, 4].map((item) => <div className="rounded-md bg-[#e9e0d3]" key={item} />)}</div></div>;
}
