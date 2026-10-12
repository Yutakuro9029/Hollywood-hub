import { Skeleton, SkeletonRegion } from "@/components/ui/skeleton";
import { getI18n } from "@/lib/i18n/server";

/** โครงหน้ารายละเอียดหนังระหว่างโหลด: backdrop + โปสเตอร์ + ข้อมูล + แถวนักแสดง */
export default async function MovieDetailLoading() {
  const { t } = await getI18n();
  return (
    <SkeletonRegion label={t.movie.loading}>
      <div className="relative">
        <div className="absolute inset-x-0 top-0 h-[62vh] min-h-[420px] bg-surface lg:h-[78vh]" />
        <div className="relative mx-auto max-w-[1400px] px-4 pt-28 sm:px-6 sm:pt-40 lg:px-10 lg:pt-[34vh]">
          <div className="grid gap-8 md:grid-cols-[240px_minmax(0,1fr)] md:items-end lg:grid-cols-[300px_minmax(0,1fr)] lg:gap-12">
            <Skeleton className="mx-auto aspect-[2/3] w-48 md:mx-0 md:w-full" />
            <div className="space-y-5">
              <Skeleton className="h-12 w-3/4 sm:h-16" />
              <Skeleton className="h-4 w-56" />
              <div className="flex gap-2">
                <Skeleton className="h-7 w-20" />
                <Skeleton className="h-7 w-24" />
                <Skeleton className="h-7 w-20" />
              </div>
              <Skeleton className="h-6 w-48" />
              <Skeleton className="h-4 w-full max-w-2xl" />
              <Skeleton className="h-4 w-5/6 max-w-xl" />
              <div className="flex gap-3 pt-2">
                <Skeleton className="h-12 w-36" />
                <Skeleton className="h-12 w-44" />
              </div>
            </div>
          </div>
          <Skeleton className="mt-12 h-20 w-full" />
        </div>
      </div>

      <div className="mx-auto mt-20 max-w-[1400px] px-4 sm:px-6 lg:px-10">
        <Skeleton className="h-7 w-32" />
        <div className="mt-6 flex gap-8 overflow-hidden">
          {Array.from({ length: 7 }, (_, i) => (
            <div key={i} className="w-28 shrink-0 sm:w-36">
              <Skeleton className="aspect-square w-full rounded-full" />
              <Skeleton className="mx-auto mt-4 h-4 w-3/4" />
            </div>
          ))}
        </div>
      </div>
    </SkeletonRegion>
  );
}
