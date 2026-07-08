import { AgentDetail } from "@/components/sections/AgentDetail"

export default async function AgentDetailPage({ params }: { params: Promise<{ "agent-id": string }> }) {
  const { "agent-id": agentId } = await params
  return <AgentDetail agentSlug={agentId} />
}
