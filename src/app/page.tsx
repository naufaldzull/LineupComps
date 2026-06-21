import { DashboardPage } from "@/components/dashboard-page";

type HomePageProps = {
  searchParams: Promise<{
    mock?: string;
  }>;
};

export default async function HomePage({ searchParams }: HomePageProps) {
  const params = await searchParams;
  const hasApiSportsKey = Boolean(process.env.APISPORTS_KEY);
  const useMockData = params.mock === "true" || !hasApiSportsKey;
  const isOpenRouterAvailable = Boolean(process.env.OPENROUTER_API_KEY);

  return (
    <DashboardPage
      dataMode={useMockData ? "demo" : "live"}
      useMockData={useMockData}
      isOpenRouterAvailable={isOpenRouterAvailable}
    />
  );
}
