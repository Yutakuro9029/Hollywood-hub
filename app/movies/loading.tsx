import { Skeleton, SkeletonRegion } from "@/components/ui/skeleton";

function MoviePosterSkeleton() {
  return (
    <div className="space-y-3">
      <Skeleton className="aspect-[2/3] w-full rounded-xl" />
      <Skeleton className="h-4 w-4/5" />
      {/* ดาวเรตติ้ง 5 ดวง + ตัวเลข */}
      <div className="flex items-center gap-1.5">
        {Array.from({ length: 5 }, (_, i) => (
          <Skeleton
            key={i}
            className="h-3.5 w-3.5 rounded-sm bg-amber-200/70 dark:bg-amber-400/15"
          />
        ))}
        <Skeleton className="ml-1 h-3.5 w-7" />
      </div>
    </div>
  );
}

export default function MoviesLoading() {
  return (
    <SkeletonRegion
      label="กำลังโหลดภาพยนตร์"
      className="mx-auto max-w-7xl px-4 py-10 sm:px-6 lg:px-8"
    >
      {/* Page header */}
      <div className="space-y-3">
        <Skeleton className="h-9 w-52 sm:h-10 sm:w-64" />
        <Skeleton className="h-4 w-full max-w-sm" />
      </div>

      {/* ช่องค้นหา */}
      <div className="mt-8 flex flex-col gap-3 sm:flex-row">
        <Skeleton className="h-11 flex-1 rounded-lg" />
        <Skeleton className="h-11 w-full rounded-lg bg-amber-200/70 sm:w-28 dark:bg-amber-400/15" />
      </div>

      {/* Filter แนวหนัง (chips) */}
      <div className="mt-5 flex gap-2 overflow-hidden">
        {[72, 88, 64, 96, 80, 70, 90, 76].map((w, i) => (
          <Skeleton
            key={i}
            style={{ width: w }}
            className="h-8 shrink-0 rounded-full"
          />
        ))}
      </div>

      {/* Grid โปสเตอร์ 2:3 จำนวน 12 ช่อง */}
      <div className="mt-8 grid grid-cols-2 gap-x-4 gap-y-8 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6">
        {Array.from({ length: 12 }, (_, i) => (
          <MoviePosterSkeleton key={i} />
        ))}
      </div>

      {/* Pagination */}
      <div className="mt-12 flex justify-center gap-2">
        {Array.from({ length: 5 }, (_, i) => (
          <Skeleton key={i} className="h-9 w-9 rounded-lg" />
        ))}
      </div>
    </SkeletonRegion>
  );
}
