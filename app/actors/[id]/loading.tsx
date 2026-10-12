import { Skeleton, SkeletonRegion } from "@/components/ui/skeleton";
import { getI18n } from "@/lib/i18n/server";

/** โครงหน้าดาราระหว่างโหลด: ภาพกรอบทอง + ชื่อ + ข้อมูล + ตารางผลงาน */
export default async function ActorDetailLoading() {
  const { t } = await getI18n();
  return (
    <SkeletonRegion label={t.actor.loading}>
      <div className="mx-auto max-w-[1400px] px-4 pt-10 sm:px-6 lg:px-10">
        <Skeleton className="h-4 w-28" />
        <div className="mt-8 grid gap-10 lg:grid-cols-12 lg:gap-14">
          <Skeleton className="mx-auto aspect-[4/5] w-full max-w-md rounded-none lg:col-span-5 lg:max-w-none" />
          <div className="space-y-6 lg:col-span-7 lg:pt-2">
            <Skeleton className="h-14 w-3/4 sm:h-20" />
            <div className="grid max-w-2xl grid-cols-3 gap-8 border-y border-line py-5">
              <Skeleton className="h-10" />
              <Skeleton className="h-10" />
              <Skeleton className="h-10" />
            </div>
            <Skeleton className="h-4 w-full max-w-[64ch]" />
            <Skeleton className="h-4 w-11/12 max-w-[60ch]" />
            <Skeleton className="h-4 w-4/5 max-w-[56ch]" />
          </div>
        </div>

        <div className="mt-24 border-t border-line pt-6">
          <Skeleton className="h-9 w-56" />
          <div className="mt-6 space-y-px">
            {Array.from({ length: 5 }, (_, i) => (
              <Skeleton key={i} className="h-20 w-full rounded-none" />
            ))}
          </div>
        </div>
      </div>
    </SkeletonRegion>
  );
}
