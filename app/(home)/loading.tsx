import { Skeleton, SkeletonRegion } from "@/components/ui/skeleton";
import { getI18n } from "@/lib/i18n/server";

/** โครงหน้าแรกระหว่างโหลด: กำแพงใบหน้า + หัวข้อกลางจอ + บทความดาราประจำสัปดาห์ */
export default async function HomeLoading() {
  const { t } = await getI18n();
  return (
    <SkeletonRegion label={t.home.loading}>
      <div className="relative flex min-h-[92svh] items-center overflow-hidden lg:min-h-[min(100vh,960px)]">
        <div aria-hidden className="absolute inset-0 grid grid-cols-6 content-start gap-px opacity-40 sm:grid-cols-8 lg:grid-cols-10 xl:grid-cols-12">
          {Array.from({ length: 84 }, (_, i) => (
            <Skeleton key={i} className="aspect-square rounded-none" />
          ))}
        </div>
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_55%_60%_at_50%_52%,rgba(10,10,10,0.96)_0%,rgba(10,10,10,0.6)_100%)]" />
        <div className="relative mx-auto flex w-full max-w-3xl flex-col items-center gap-5 px-4 pt-28">
          <Skeleton className="h-12 w-4/5 sm:h-16" />
          <Skeleton className="h-4 w-2/3" />
          <Skeleton className="mt-5 h-12 w-full max-w-xl" />
        </div>
      </div>

      <div className="mx-auto mt-10 grid max-w-[1400px] gap-10 px-4 sm:px-6 lg:grid-cols-12 lg:px-10">
        <Skeleton className="aspect-[4/5] w-full lg:col-span-5" />
        <div className="space-y-5 lg:col-span-7 lg:pt-4">
          <Skeleton className="h-16 w-3/4" />
          <Skeleton className="h-4 w-1/2" />
          <Skeleton className="h-4 w-full" />
          <Skeleton className="h-4 w-5/6" />
        </div>
      </div>
    </SkeletonRegion>
  );
}
