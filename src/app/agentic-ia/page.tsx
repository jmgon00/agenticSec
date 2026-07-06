import { PageHeader } from "@/components/sections/PageHeader";
import { AgenticIATabs } from "@/components/sections/AgenticIATabs";
import { AGENTIC_IA_CONTENT } from "@/content/agentic-ia";

export default function AgenticIAPage() {
  return (
    <>
      <PageHeader
        title="Agentic IA"
        subtitle="Tu diferenciador: Automatización inteligente de procesos de seguridad"
      />
      <AgenticIATabs tabs={AGENTIC_IA_CONTENT} />
    </>
  );
}
