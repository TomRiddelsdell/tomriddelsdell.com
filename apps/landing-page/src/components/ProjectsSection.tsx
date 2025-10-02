import Image from 'next/image'

export function ProjectsSection() {
  const projects = [
    {
      title: 'Quantitative Finance Platform',
      description: 'Advanced financial modeling platform with risk management capabilities, portfolio optimization, and real-time market data integration.',
      image: '/impliedvol.jpeg',
      technologies: ['Python', 'NumPy', 'Pandas', 'FastAPI', 'PostgreSQL'],
      status: 'Active Development'
    },
    {
      title: 'Risk Management System',
      description: 'Comprehensive risk assessment and monitoring system for investment portfolios with advanced mathematical modeling and scenario analysis.',
      image: '/background.jpg',
      technologies: ['Python', 'SciPy', 'Plotly', 'React', 'TypeScript'],
      status: 'Production Ready'
    },
    {
      title: 'Event-Sourced Portfolio Service',
      description: 'Modern portfolio management system built with domain-driven design principles and event sourcing architecture for audit and compliance.',
      image: '/me.jpg',
      technologies: ['Next.js', 'TypeScript', 'Event Sourcing', 'PostgreSQL'],
      status: 'In Development'
    }
  ]

  return (
    <section id="projects" className="py-20 bg-white">
      <div className="container mx-auto px-4">
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-4xl font-bold text-gray-900 mb-4">Featured Projects</h2>
            <p className="text-xl text-gray-600 max-w-2xl mx-auto">
              A selection of projects showcasing quantitative finance and modern software architecture
            </p>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
            {projects.map((project) => (
              <div key={project.title} className="bg-white rounded-lg shadow-lg overflow-hidden">
                <div className="relative h-48">
                  <Image
                    src={project.image}
                    alt={project.title}
                    fill
                    className="object-cover"
                  />
                </div>
                <div className="p-6">
                  <div className="flex items-center justify-between mb-3">
                    <h3 className="text-xl font-bold text-gray-900">{project.title}</h3>
                    <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                      project.status === 'Production Ready' 
                        ? 'bg-green-100 text-green-800'
                        : project.status === 'Active Development'
                        ? 'bg-blue-100 text-blue-800'
                        : 'bg-yellow-100 text-yellow-800'
                    }`}>
                      {project.status}
                    </span>
                  </div>
                  <p className="text-gray-600 mb-4">{project.description}</p>
                  <div className="flex flex-wrap gap-2">
                    {project.technologies.map((tech) => (
                      <span
                        key={tech}
                        className="bg-gray-100 text-gray-700 px-2 py-1 rounded text-sm"
                      >
                        {tech}
                      </span>
                    ))}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  )
}
