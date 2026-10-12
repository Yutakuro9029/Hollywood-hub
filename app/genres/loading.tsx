import { Skeleton, SkeletonRegion } from "@/components/ui/skeleton";
import { getI18n } from "@/lib/i18n/server";

/** โครงหน้าหมวดหมู่ระหว่างโหลด: หัวข้อ + การ์ดอารมณ์ 4 ใบ + กระเบื้องแนวหนัง */
export default async function GenresLoading() {
  const { t } = await getI18n();
  return (
    <SkeletonRegion label={t.genres.loading}>
      <div className="mx-auto max-w-[1400px] px-4 pb-8 pt-14 sm:px-6 lg:px-10">
        <Skeleton className="h-14 w-56 sm:h-16" />
        <Skeleton className="mt-4 h-4 w-full max-w-md" />

        <div className="mt-16 border-t border-line pt-6">
          <Skeleton className="h-9 w-52" />
          <div className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {Array.from({ length: 4 }, (_, i) => (
              <Skeleton key={i} className="h-40 rounded-none" />
            ))}
          </div>
        </div>

        <div className="mt-20 border-t border-line pt-6">
          <Skeleton className="h-9 w-48" />
          <div className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            <Skeleton className="min-h-80 rounded-none sm:col-span-2 lg:row-span-2 lg:min-h-[32rem]" />
            {Array.from({ length: 7 }, (_, i) => (
              <Skeleton key={i} className="min-h-60 rounded-none" />
            ))}
          </div>
        </div>
      </div>
    </SkeletonRegion>
  );
}
