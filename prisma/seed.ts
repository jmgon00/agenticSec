import { PrismaClient } from "@prisma/client"
import { SEED_AGENTS } from "../src/content/agents"

const prisma = new PrismaClient()

async function main() {
  console.log("Seeding agents...")

  for (const agentData of SEED_AGENTS) {
    const agent = await prisma.agent.upsert({
      where: { slug: agentData.slug },
      update: agentData as any,
      create: agentData as any,
    })
    console.log(`Created/updated agent: ${agent.name}`)
  }

  console.log("Seeding complete!")
}

main()
  .catch((e) => {
    console.error(e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })
