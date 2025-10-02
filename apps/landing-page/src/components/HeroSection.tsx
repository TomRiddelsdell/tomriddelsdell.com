import Image from 'next/image'

export function HeroSection() {
  return (
    <section id="home" className="pt-16 min-h-screen relative overflow-hidden">
      <div className="absolute inset-0 z-0">
        <Image
          src="/background.jpg"
          alt="Background"
          fill
          className="object-cover"
          priority
        />
        <div className="absolute inset-0 bg-black/40" />
      </div>

      <div className="relative z-10 container mx-auto px-4 py-20 flex items-center min-h-screen">
        <div className="flex flex-col lg:flex-row items-center gap-12 w-full">
          <div className="flex-1 text-center lg:text-left text-white">
            <h1 className="text-5xl lg:text-7xl font-bold mb-6 leading-tight">
              Tom Riddelsdell
            </h1>
            <h2 className="text-2xl lg:text-3xl mb-6 text-blue-200">
              Quantitative Finance & Software Engineering
            </h2>
            <p className="text-xl mb-8 text-gray-200 max-w-2xl">
              Building sophisticated portfolio platforms with modern architecture patterns. 
              Expertise in event sourcing, domain-driven design, and quantitative analysis.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center lg:justify-start">
              <a
                href="#projects"
                className="bg-blue-600 hover:bg-blue-700 text-white px-8 py-3 rounded-lg font-semibold transition-colors duration-200"
              >
                View Projects
              </a>
              <a
                href="#contact"
                className="border-2 border-white text-white hover:bg-white hover:text-gray-900 px-8 py-3 rounded-lg font-semibold transition-colors duration-200"
              >
                Get in Touch
              </a>
            </div>
          </div>

          <div className="flex-shrink-0">
            <div className="relative w-80 h-80 lg:w-96 lg:h-96">
              <Image
                src="/me.jpg"
                alt="Tom Riddelsdell"
                fill
                className="object-cover rounded-full border-4 border-white/20"
                priority
              />
            </div>
          </div>
        </div>
      </div>

      <div className="absolute bottom-8 left-1/2 transform -translate-x-1/2 text-white animate-bounce">
        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 14l-7 7m0 0l-7-7m7 7V3" />
        </svg>
      </div>
    </section>
  )
}