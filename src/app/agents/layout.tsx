export default function AgentsLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen bg-gradient-to-b from-dark-base to-gray-900">
      {children}
    </div>
  )
}
