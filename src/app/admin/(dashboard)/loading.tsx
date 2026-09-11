export default function AdminDashboardLoading() {
  return <div aria-label="Loading dashboard" className="animate-pulse space-y-10" role="status"><div className="h-28 max-w-2xl rounded-md bg-[#e9e0d3]" /><div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">{[1, 2, 3, 4].map((item) => <div className="h-44 rounded-md bg-[#e9e0d3]" key={item} />)}</div><div className="grid gap-8 xl:grid-cols-[1.45fr_0.75fr]"><div className="h-[31rem] rounded-md bg-[#e9e0d3]" /><div className="h-[31rem] rounded-md bg-[#e9e0d3]" /></div></div>;
}
