export default function HomePage() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100">
      <header className="container mx-auto px-4 py-16 text-center">
        <h1 className="text-5xl font-bold text-gray-900 mb-4">
          Tom Riddelsdell
        </h1>
        <p className="text-xl text-gray-600 mb-8">
          Portfolio Platform - Landing Page
        </p>
        <div className="space-y-2">
          <p className="text-lg text-gray-700">
            Built with Next.js + TypeScript + Tailwind CSS
          </p>
          <p className="text-lg text-gray-700">
            Deployed via Cloudflare Pages
          </p>
          <p className="text-sm text-gray-500 mt-8">
            Following DDD, Event Sourcing, and CQRS Architecture
          </p>
        </div>
      </header>

      <main className="container mx-auto px-4 pb-16">
        <section className="grid md:grid-cols-3 gap-8">
          <div className="bg-white rounded-lg shadow-md p-6">
            <h3 className="text-xl font-semibold mb-3">Domain-Driven Design</h3>
            <p className="text-gray-600">
              Implementing bounded contexts with clear domain models and aggregates.
            </p>
          </div>
          
          <div className="bg-white rounded-lg shadow-md p-6">
            <h3 className="text-xl font-semibold mb-3">Event Sourcing</h3>
            <p className="text-gray-600">
              Event-driven architecture with CQRS pattern for scalable data management.
            </p>
          </div>
          
          <div className="bg-white rounded-lg shadow-md p-6">
            <h3 className="text-xl font-semibold mb-3">Hybrid Deployment</h3>
            <p className="text-gray-600">
              Technology-agnostic orchestration supporting both monolith and microservice patterns.
            </p>
          </div>
        </section>
      </main>
    </div>
  )
}