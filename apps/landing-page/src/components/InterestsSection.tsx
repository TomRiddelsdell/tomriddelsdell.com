import Image from 'next/image'

export function InterestsSection() {
  return (
    <section
      id="about"
      className="py-20 bg-gradient-to-br from-gray-900 via-blue-900 to-gray-900"
    >
      <div className="container mx-auto px-4">
        <div className="max-w-6xl mx-auto">
          <div className="grid lg:grid-cols-2 gap-12 items-center">
            <div className="relative">
              <div className="relative w-full h-96 lg:h-[500px] rounded-lg overflow-hidden shadow-2xl">
                <Image
                  src="/impliedvol.jpeg"
                  alt="Implied Volatility Surface"
                  fill
                  className="object-cover"
                  sizes="(max-width: 1024px) 100vw, 50vw"
                  quality={85}
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/50 to-transparent" />
              </div>
            </div>

            <div className="text-white">
              <blockquote className="text-xl lg:text-2xl leading-relaxed mb-8 italic">
                <span className="text-blue-300 text-4xl">&ldquo;</span>
                In quantitative finance, the most elegant models are those that
                balance mathematical rigor with practical application. The
                beauty lies not in complexity, but in the precision with which
                we can forecast market behavior.
                <span className="text-blue-300 text-4xl">&rdquo;</span>
              </blockquote>

              <div>
                <p className="text-blue-200 font-medium">
                  — Navigating markets through data-driven decisions
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  )
}
