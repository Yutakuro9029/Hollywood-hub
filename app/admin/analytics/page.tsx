import Link from "next/link";
import { Clapperboard, UserCog } from "lucide-react";
import { requireAdmin } from "@/lib/dal";
import { getAnalyticsData } from "@/lib/dashboard-data";
import { nowTh } from "@/lib/dashboard-format";
import { PageHeader, quickBtn } from "@/components/admin/dashboard-ui";
import DashboardCharts from "@/components/admin/analytics-charts";

export const dynamic = "force-dynamic";

export default async function AdminAnalyticsPage() {
  await requireAdmin();
  const { movies, actors } = await getAnalyticsData();

  return (
    <div className="space-y-6">
      <PageHeader
        title="วิเคราะห์เชิงกราฟ"
        description="กราฟสำคัญ 4 แบบ — คลิกชิ้นของ Genre หรือแท่งดาราเพื่อกรองข้อมูลทุกกราฟพร้อมกัน"
        updatedAt={nowTh()}
        actions={
          <>
            <Link href="/admin/actors" className={quickBtn}>
              <UserCog size={16} /> จัดการดารา
            </Link>
            <Link href="/admin/movies" className={quickBtn}>
              <Clapperboard size={16} /> จัดการภาพยนตร์
            </Link>
          </>
        }
      />
      <DashboardCharts movies={movies} actors={actors} />
    </div>
  );
}
