import { Skeleton, SkeletonRegion, skeletonCardCls } from "@/components/ui/skeleton";

export default function ActorDetailLoading() {
  return (
    <SkeletonRegion
      label="กำลังโหลดข้อมูลดารา"
      className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8"
    >
      {/* ปุ่มย้อนกลับ */}
      <Skeleton className="h-4 w-28" />

      {/* Hero Banner */}
      <section
        className={`${skeletonCardCls} mt-6 flex flex-col gap-6 p-6 md:flex-row md:items-center md:gap-10 md:p-10`}
      >
        <Skeleton className="mx-auto h-48 w-48 shrink-0 rounded-3xl md:mx-0 md:h-64 md:w-64" />

        <div className="flex-1 space-y-5">
          <Skeleton className="h-10 w-3/4 max-w-md md:h-12" />

          <div className="flex flex-wrap gap-2">
            <Skeleton className="h-7 w-24 rounded-full" />
            <Skeleton className="h-7 w-32 rounded-full" />
            <Skeleton className="h-7 w-28 rounded-full bg-amber-200/70 dark:bg-amber-400/15" />
          </div>

          <div className="max-w-2xl space-y-2.5">
            <Skeleton className="h-4 w-full" />
            <Skeleton className="h-4 w-full" />
            <Skeleton className="h-4 w-11/12" />
            <Skeleton className="h-4 w-2/3" />
          </div>
        </div>
      </section>

      {/* Career Stats */}
      <section className="mt-6 grid grid-cols-1 gap-4 sm:grid-cols-3">
        {Array.from({ length: 3 }, (_, i) => (
          <div key={i} className={`${skeletonCardCls} space-y-3 p-5`}>
            <Skeleton className="h-3.5 w-24" />
            <Skeleton className="h-8 w-32 bg-amber-200/70 dark:bg-amber-400/15" />
          </div>
        ))}
      </section>

      {/* Filmography */}
      <section className="mt-12">
        <Skeleton className="h-7 w-48" />
        <div className="mt-6 grid grid-cols-2 gap-x-4 gap-y-8 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6">
          {Array.from({ length: 6 }, (_, i) => (
            <div key={i} className="space-y-3">
              <Skeleton className="aspect-[2/3] w-full rounded-xl" />
              <Skeleton className="h-4 w-4/5" />
              <Skeleton className="h-3.5 w-1/2" />
            </div>
          ))}
        </div>
      </section>
    </SkeletonRegion>
  );
}
