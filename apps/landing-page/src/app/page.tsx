import { Navigation } from '@/components/Navigation'
import { HeroSection } from '@/components/HeroSection'
import { InterestsSection } from '@/components/InterestsSection'
// import { ProjectsSection } from '@/components/ProjectsSection'
import { ContactSection } from '@/components/ContactSection'
import { Footer } from '@/components/Footer'
import config from '@/lib/config'

export default function HomePage() {
  return (
    <div className="min-h-screen bg-white">
      <Navigation />
      <HeroSection />
      <InterestsSection />
      {/* <ProjectsSection /> */}
      <ContactSection />
      <Footer />

      {/* Debug info only in development */}
      {config.features.debugMode && (
        <div className="fixed bottom-4 right-4 bg-black bg-opacity-75 text-white text-xs p-2 rounded">
          Environment: {config.env} | Build:{' '}
          {config.isProd ? 'production' : 'development'}
        </div>
      )}
    </div>
  )
}
