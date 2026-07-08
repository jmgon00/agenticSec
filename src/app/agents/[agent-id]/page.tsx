import { AgentDetail } from "@/components/sections/AgentDetail"

export default function AgentDetailPage({ params }: { params: { "agent-id": string } }) {
  return <AgentDetail agentSlug={params["agent-id"]} />
}
