import { FaqSection } from "./faq-section";
import { FeatureSections } from "./feature-sections";
import { FooterSection } from "./footer-section";
import { HeroSection } from "./hero-section";
import { SiteHeader } from "./site-header";
import { SmoothScroll } from "./smooth-scroll";
import { UseCasesSection } from "./use-cases-section";

const whatsappChatUrl = "https://wa.me/14155238886?text=join%20wrapped-detail";

export function LandingPage() {
	return (
		<SmoothScroll>
			<main className="min-h-screen bg-white text-[#111827]">
				<SiteHeader whatsappChatUrl={whatsappChatUrl} />
				<HeroSection whatsappChatUrl={whatsappChatUrl} />
				<FeatureSections whatsappChatUrl={whatsappChatUrl} />
				<UseCasesSection />
				<FaqSection />
				<FooterSection />
			</main>
		</SmoothScroll>
	);
}
