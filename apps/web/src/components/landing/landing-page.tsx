import { FeatureSections } from './feature-sections'
import { FaqSection } from './faq-section'
import { FooterSection } from './footer-section'
import { HeroSection } from './hero-section'
import { SmoothScroll } from './smooth-scroll'
import { SiteHeader } from './site-header'

const whatsappChatUrl = '#start-chat'

export function LandingPage() {
  return (
    <SmoothScroll>
      <main className="min-h-screen bg-white text-[#111827]">
        <SiteHeader whatsappChatUrl={whatsappChatUrl} />
        <HeroSection whatsappChatUrl={whatsappChatUrl} />
        <FeatureSections whatsappChatUrl={whatsappChatUrl} />
        <FaqSection />
        <FooterSection />
      </main>
    </SmoothScroll>
  )
}
