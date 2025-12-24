import Image from 'next/image'

export function ProjectsSection() {
  const projects = [
    {
      title: 'Portfolio Platform',
      description:
        'Event-sourced portfolio management system built with domain-driven design principles.',
      image: '/impliedvol.webp',
      technologies: ['Next.js', 'TypeScript', 'Event Sourcing', 'PostgreSQL'],
      status: 'In Development',
    },
    {
      title: 'Quantitative Models',
      description:
        'Collection of quantitative finance models for options pricing and portfolio optimization.',
      image: '/background.webp',
      technologies: ['Python', 'NumPy', 'SciPy', 'FastAPI'],
      status: 'Active Development',
    },
    {
      title: 'Microservices Architecture',
      description:
        'Hybrid deployment architecture supporting both monolithic and microservice patterns.',
      image: '/me.webp',
      technologies: ['Docker', 'Terraform', 'AWS', 'Cloudflare'],
      status: 'Production Ready',
    },
  ]

  return (
    <section id="projects" className="py-20 bg-white">
      <div className="container mx-auto px-4">
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-4xl font-bold text-gray-900 mb-4">
              Featured Projects
            </h2>
            <p className="text-xl text-gray-600 max-w-2xl mx-auto">
              A selection of projects showcasing quantitative finance and modern
              software architecture
            </p>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
            {projects.map((project) => (
              <div
                key={project.title}
                className="bg-white rounded-lg shadow-lg overflow-hidden"
              >
                <div className="relative h-48">
                  <Image
                    src={project.image}
                    alt={project.title}
                    fill
                    className="object-cover"
                    sizes="(max-width: 768px) 100vw, (max-width: 1024px) 50vw, 33vw"
                    quality={80}
                  />
                </div>
                <div className="p-6">
                  <div className="flex items-center justify-between mb-3">
                    <h3 className="text-xl font-bold text-gray-900">
                      {project.title}
                    </h3>
                    <span
                      className={`px-2 py-1 rounded-full text-xs font-medium ${
                        project.status === 'Production Ready'
                          ? 'bg-green-100 text-green-800'
                          : project.status === 'Active Development'
                            ? 'bg-blue-100 text-blue-800'
                            : 'bg-yellow-100 text-yellow-800'
                      }`}
                    >
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
