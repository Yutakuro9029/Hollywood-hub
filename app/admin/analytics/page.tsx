import Link from "next/link";
import { Clapperboard, UserCog } from "lucide-react";
import { requireAdmin } from "@/lib/dal";
import { getAnalyticsData } from "@/lib/dashboard-data";
import { getI18n } from "@/lib/i18n/server";
import { PageHeader, quickBtn } from "@/components/admin/dashboard-ui";
import DashboardCharts from "@/components/admin/analytics-charts";

export const dynamic = "force-dynamic";

export default async function AdminAnalyticsPage() {
  await requireAdmin();
  const [{ movies, actors }, { t }] = await Promise.all([getAnalyticsData(), getI18n()]);

  return (
    <div className="space-y-6">
      <PageHeader
        title={t.admin.analytics}
        description={t.admin.an.description}
        updatedAt={t.date.dateTime(new Date())}
        actions={
          <>
            <Link href="/admin/actors" className={quickBtn}>
              <UserCog size={16} /> {t.admin.manageActors}
            </Link>
            <Link href="/admin/movies" className={quickBtn}>
              <Clapperboard size={16} /> {t.admin.manageMovies}
            </Link>
          </>
        }
      />
      <DashboardCharts movies={movies} actors={actors} />
    </div>
  );
}
