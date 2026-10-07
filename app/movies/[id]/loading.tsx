import { Skeleton, SkeletonRegion, skeletonCardCls } from "@/components/ui/skeleton";

export default function MovieDetailLoading() {
  return (
    <SkeletonRegion label="กำลังโหลดข้อมูลภาพยนตร์">
      {/* Backdrop กว้าง */}
      <Skeleton className="h-56 w-full rounded-none sm:h-72 md:h-96" />

      <div className="mx-auto max-w-7xl px-4 pb-12 sm:px-6 lg:px-8">
        <div className="grid gap-8 md:grid-cols-[280px_1fr] lg:grid-cols-[320px_1fr]">
          {/* โปสเตอร์แนวตั้ง 2:3 (ซ้อนทับ backdrop บนจอ md ขึ้นไป) */}
          <div className="-mt-20 mx-auto w-48 md:-mt-32 md:w-full">
            <Skeleton className="aspect-[2/3] w-full rounded-2xl ring-4 ring-zinc-50 dark:ring-slate-950" />
          </div>

          <div className="space-y-6 pt-2 md:pt-8">
            {/* ชื่อเรื่อง + meta */}
            <div className="space-y-4">
              <Skeleton className="h-10 w-4/5 md:h-12" />
              <div className="flex flex-wrap gap-2">
                <Skeleton className="h-7 w-16 rounded-full" />
                <Skeleton className="h-7 w-24 rounded-full" />
                <Skeleton className="h-7 w-20 rounded-full" />
                <Skeleton className="h-7 w-28 rounded-full bg-amber-200/70 dark:bg-amber-400/15" />
              </div>
            </div>

            {/* สถิติ: เรตติ้ง / รายได้ / ปีที่ฉาย */}
            <div className="grid grid-cols-3 gap-3">
              {Array.from({ length: 3 }, (_, i) => (
                <div key={i} className={`${skeletonCardCls} space-y-2.5 p-4`}>
                  <Skeleton className="h-3 w-14" />
                  <Skeleton className="h-6 w-16 bg-amber-200/70 dark:bg-amber-400/15" />
                </div>
              ))}
            </div>

            {/* กล่องเรื่องย่อ */}
            <div className={`${skeletonCardCls} space-y-3 p-6`}>
              <Skeleton className="h-5 w-28" />
              <Skeleton className="h-4 w-full" />
              <Skeleton className="h-4 w-full" />
              <Skeleton className="h-4 w-11/12" />
              <Skeleton className="h-4 w-3/5" />
            </div>

            {/* การ์ดดารานำ */}
            <div className="space-y-3">
              <Skeleton className="h-5 w-24" />
              <div className={`${skeletonCardCls} flex items-center gap-4 p-4 sm:max-w-md`}>
                <Skeleton className="h-16 w-16 shrink-0 rounded-2xl" />
                <div className="flex-1 space-y-2.5">
                  <Skeleton className="h-5 w-3/4" />
                  <Skeleton className="h-3.5 w-1/2" />
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </SkeletonRegion>
  );
}
