"use client"

import { useState, useEffect } from "react"
import { PageHeader } from "@/components/sections/PageHeader"
import { EmailModal } from "@/components/sections/EmailModal"
import { AgentGallery } from "@/components/sections/AgentGallery"

const STORAGE_KEY = "agenticsec_user_email"

export default function AgentsPage() {
  const [userEmail, setUserEmail] = useState<string | null>(null)
  const [showEmailModal, setShowEmailModal] = useState(false)

  // Check for stored email on mount
  useEffect(() => {
    const storedEmail = localStorage.getItem(STORAGE_KEY)
    if (storedEmail) {
      setUserEmail(storedEmail)
    } else {
      setShowEmailModal(true)
    }
  }, [])

  const handleEmailSubmit = (email: string) => {
    if (email) {
      localStorage.setItem(STORAGE_KEY, email)
      setUserEmail(email)
    }
    setShowEmailModal(false)
  }

  return (
    <>
      <PageHeader
        title="Agentes de IA"
        subtitle="Descubre, aprende e interactúa con agentes inteligentes"
      />
      <AgentGallery />
      <EmailModal isOpen={showEmailModal} onSubmit={handleEmailSubmit} />
    </>
  )
}
