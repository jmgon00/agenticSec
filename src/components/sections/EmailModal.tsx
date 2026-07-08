"use client"

import { useState } from "react"

interface EmailModalProps {
  onSubmit: (email: string) => void
  isOpen: boolean
}

export const EmailModal = ({ onSubmit, isOpen }: EmailModalProps) => {
  const [email, setEmail] = useState("")
  const [error, setError] = useState("")

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    setError("")

    // Validate email
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
    if (!emailRegex.test(email)) {
      setError("Please enter a valid email address")
      return
    }

    onSubmit(email)
  }

  const handleDismiss = () => {
    // Allow dismiss without email
    onSubmit("")
  }

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 bg-black/80 z-50 flex items-center justify-center p-4">
      <div className="bg-gray-900 border border-gray-700 rounded-lg max-w-md w-full p-8">
        <h2 className="text-2xl font-bold text-white mb-2">Welcome to Agents</h2>
        <p className="text-gray-400 mb-6">
          Enter your email to start exploring AI agents and tracking your conversations.
        </p>

        <form onSubmit={handleSubmit}>
          <div className="mb-4">
            <label className="block text-gray-300 text-sm font-semibold mb-2">
              Email Address
            </label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="your@email.com"
              className="w-full px-4 py-2 bg-gray-800 border border-gray-600 rounded-lg text-white placeholder-gray-500 focus:outline-none focus:border-cyan-400"
            />
            {error && <p className="text-red-400 text-sm mt-2">{error}</p>}
          </div>

          <button
            type="submit"
            className="w-full bg-cyan-400 text-gray-900 font-semibold py-2 rounded-lg hover:bg-cyan-300 transition-colors mb-3"
          >
            Get Started
          </button>

          <button
            type="button"
            onClick={handleDismiss}
            className="w-full text-gray-400 hover:text-gray-300 py-2 transition-colors"
          >
            Continue without email
          </button>
        </form>
      </div>
    </div>
  )
}
