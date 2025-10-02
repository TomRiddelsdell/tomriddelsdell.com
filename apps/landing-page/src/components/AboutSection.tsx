export function AboutSection() {
  const skills = [
    { category: 'Languages', items: ['TypeScript', 'Python', 'SQL', 'R'] },
    { category: 'Frontend', items: ['React', 'Next.js', 'Tailwind CSS', 'Zustand'] },
    { category: 'Backend', items: ['Node.js', 'FastAPI', 'PostgreSQL', 'Event Sourcing'] },
    { category: 'Cloud & DevOps', items: ['Cloudflare', 'AWS', 'Docker', 'Terraform'] },
    { category: 'Finance', items: ['Options Pricing', 'Risk Management', 'Portfolio Optimization', 'Quantitative Analysis'] },
    { category: 'Architecture', items: ['DDD', 'CQRS', 'Microservices', 'Event-Driven Architecture'] },
  ]

  return (
    <section id="about" className="py-20 bg-gray-50">
      <div className="container mx-auto px-4">
        <div className="max-w-4xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-4xl font-bold text-gray-900 mb-4">About Me</h2>
            <p className="text-xl text-gray-600 max-w-2xl mx-auto">
              Passionate about bridging quantitative finance and modern software engineering
            </p>
          </div>

          <div className="grid lg:grid-cols-2 gap-12 mb-16">
            <div>
              <h3 className="text-2xl font-semibold text-gray-900 mb-6">Background</h3>
              <div className="space-y-4 text-gray-700">
                <p>
                  I specialize in building sophisticated portfolio platforms that combine 
                  quantitative finance expertise with modern software architecture patterns. 
                  My work focuses on creating scalable, maintainable systems for financial analysis 
                  and portfolio management.
                </p>
                <p>
                  With deep experience in both financial markets and software engineering, 
                  I develop solutions that handle complex quantitative models while maintaining 
                  the reliability and performance required for production financial systems.
                </p>
                <p>
                  I'm particularly interested in event sourcing, domain-driven design, and 
                  how these architectural patterns can improve the way we build financial 
                  technology systems.
                </p>
              </div>
            </div>

            <div>
              <h3 className="text-2xl font-semibold text-gray-900 mb-6">Architecture Philosophy</h3>
              <div className="space-y-4 text-gray-700">
                <div className="bg-white p-6 rounded-lg shadow-sm">
                  <h4 className="font-semibold text-blue-600 mb-2">Domain-Driven Design</h4>
                  <p className="text-sm">
                    Building software that reflects the real-world domain with clear bounded contexts 
                    and ubiquitous language.
                  </p>
                </div>
                <div className="bg-white p-6 rounded-lg shadow-sm">
                  <h4 className="font-semibold text-blue-600 mb-2">Event Sourcing</h4>
                  <p className="text-sm">
                    Capturing all changes as immutable events for complete audit trails and 
                    temporal queries.
                  </p>
                </div>
                <div className="bg-white p-6 rounded-lg shadow-sm">
                  <h4 className="font-semibold text-blue-600 mb-2">CQRS</h4>
                  <p className="text-sm">
                    Separating read and write operations for optimized performance and scalability.
                  </p>
                </div>
              </div>
            </div>
          </div>

          <div>
            <h3 className="text-2xl font-semibold text-gray-900 mb-8 text-center">Technical Skills</h3>
            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
              {skills.map((skill) => (
                <div key={skill.category} className="bg-white p-6 rounded-lg shadow-sm">
                  <h4 className="font-semibold text-blue-600 mb-3">{skill.category}</h4>
                  <div className="flex flex-wrap gap-2">
                    {skill.items.map((item) => (
                      <span
                        key={item}
                        className="bg-blue-50 text-blue-700 px-3 py-1 rounded-full text-sm"
                      >
                        {item}
                      </span>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </section>
  )
}