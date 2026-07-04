import { PageHeader } from "@/components/sections/PageHeader";
import { PortfolioGrid } from "@/components/sections/PortfolioGrid";
import { PORTFOLIO_CASES } from "@/content/portfolio";

export default function PortfolioPage() {
  return (
    <main>
      <PageHeader
        title="Portfolio"
        subtitle="Proyectos completados, análisis realizados y resultados demostrables"
      />
      <PortfolioGrid cases={PORTFOLIO_CASES} />
    </main>
  );
}
