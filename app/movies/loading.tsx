import { Skeleton, SkeletonRegion } from "@/components/ui/skeleton";
import { getI18n } from "@/lib/i18n/server";

/** โครงหน้าหนังระหว่างโหลด: หัวข้อ Bodoni + แถบตัวกรอง + ใบปิดพร้อมรายชื่อดารา */
export default async function MoviesLoading() {
  const { t } = await getI18n();
  return (
    <SkeletonRegion label={t.movies.loading}>
      <div className="mx-auto max-w-[1400px] px-4 pb-8 pt-14 sm:px-6 lg:px-10">
        <div className="grid gap-8 lg:grid-cols-12 lg:items-end">
          <div className="space-y-4 lg:col-span-7">
            <Skeleton className="h-14 w-64 sm:h-16" />
            <Skeleton className="h-4 w-full max-w-md" />
          </div>
          <Skeleton className="h-12 rounded-none lg:col-span-5" />
        </div>

        <div className="mt-12 space-y-4 border-y border-line py-5">
          {[0, 1, 2].map((row) => (
            <div key={row} className="flex gap-5 overflow-hidden">
              {[56, 72, 64, 80, 60, 70, 76].map((w, i) => (
                <Skeleton key={i} style={{ width: w }} className="h-4 shrink-0" />
              ))}
            </div>
          ))}
        </div>

        <div className="mt-14 grid grid-cols-2 gap-x-5 gap-y-12 sm:grid-cols-3 md:grid-cols-4 xl:grid-cols-6">
          {Array.from({ length: 12 }, (_, i) => (
            <div key={i} className="space-y-3">
              <Skeleton className="aspect-[2/3] w-full rounded-none" />
              <Skeleton className="h-5 w-4/5" />
              <Skeleton className="h-3 w-1/2" />
              <div className="space-y-2 border-t border-line pt-3">
                {[0, 1, 2].map((j) => (
                  <div key={j} className="flex items-center gap-2">
                    <Skeleton className="h-6 w-6 rounded-full" />
                    <Skeleton className="h-3 w-24" />
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      </div>
    </SkeletonRegion>
  );
}
