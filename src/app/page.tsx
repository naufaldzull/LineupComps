import { DashboardPage } from "@/components/dashboard-page";

type HomePageProps = {
  searchParams: Promise<{
    mock?: string;
  }>;
};

export default async function HomePage({ searchParams }: HomePageProps) {
  const params = await searchParams;

  return <DashboardPage useMockData={params.mock !== "false"} />;
}
