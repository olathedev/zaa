import { useGSAP } from "@gsap/react";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { BriefcaseBusiness, Landmark, Store } from "lucide-react";
import { useRef } from "react";

gsap.registerPlugin(useGSAP, ScrollTrigger);

const useCases = [
	{
		title: "Worker opportunity matching",
		body: "A worker tells Zaa what they can do, where they are, and when they are free. Zaa turns that into a living profile and matches them to nearby work without forms or job boards.",
		eyebrow: "For job seekers",
		metric: "Top 3 matches",
		icon: BriefcaseBusiness,
		accentClassName: "bg-[#1769ff]",
		surfaceClassName: "bg-[#07111f] text-white",
		bodyClassName: "text-[#dbeafe]",
		eyebrowClassName: "text-[#93c5fd]",
		metricClassName: "text-[#caff9a]",
	},
	{
		title: "Trader growth assistant",
		body: "A market trader can record sales, ask for simple business help, find suppliers, and build trust signals through WhatsApp. Every useful interaction becomes part of their economic identity.",
		eyebrow: "For traders",
		metric: "Daily work signal",
		icon: Store,
		accentClassName: "bg-[#caff9a]",
		surfaceClassName: "bg-[#d8ffc3] text-[#07111f]",
		bodyClassName: "text-[#273244]",
		eyebrowClassName: "text-[#1769ff]",
		metricClassName: "text-[#1769ff]",
	},
	{
		title: "Financial access from real work",
		body: "Banks, lenders, insurers, and fintech partners can use verified work activity, completion history, savings behavior, and Zaa Score signals to serve people traditional credit systems miss.",
		eyebrow: "For partners",
		metric: "Alternative data",
		icon: Landmark,
		accentClassName: "bg-[#1769ff]",
		surfaceClassName: "bg-[#eef5ff] text-[#07111f]",
		bodyClassName: "text-[#475569]",
		eyebrowClassName: "text-[#175cd3]",
		metricClassName: "text-[#1769ff]",
	},
];

export function UseCasesSection() {
	const sectionRef = useRef<HTMLElement>(null);

	useGSAP(
		() => {
			if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
				return;
			}

			gsap.from("[data-use-case-heading]", {
				y: 24,
				opacity: 0,
				duration: 0.42,
				ease: "power2.out",
				stagger: 0.07,
				scrollTrigger: {
					trigger: sectionRef.current,
					start: "top 76%",
					toggleActions: "play none none reverse",
				},
			});

			gsap.from("[data-use-case-card]", {
				x: 96,
				y: 12,
				rotate: 1.5,
				opacity: 0,
				duration: 0.58,
				ease: "power3.out",
				stagger: 0.12,
				scrollTrigger: {
					trigger: "[data-use-case-track]",
					start: "top 78%",
					toggleActions: "play none none reverse",
				},
			});

			gsap.to("[data-use-case-track]", {
				x: -18,
				ease: "none",
				scrollTrigger: {
					trigger: sectionRef.current,
					start: "top bottom",
					end: "bottom top",
					scrub: 0.5,
				},
			});
		},
		{ scope: sectionRef },
	);

	return (
		<section
			ref={sectionRef}
			id="use-cases"
			className="overflow-hidden bg-white px-5 py-14 sm:px-8 sm:py-20 lg:py-28"
		>
			<div className="mx-auto max-w-7xl">
				<div className="max-w-3xl">
					<div>
						<p
							data-use-case-heading
							className="text-sm font-medium uppercase tracking-[0.16em] text-[#175cd3]"
						>
							Use cases
						</p>
					</div>
					<p
						data-use-case-heading
						className="mt-4 text-2xl font-semibold leading-tight text-[#07111f] sm:text-4xl"
					>
						Three practical ways people use Zaa to find work, grow income, and
						access financial services.
					</p>
				</div>

				<div
					data-use-case-track
					className="mt-10 flex snap-x gap-4 overflow-x-auto pb-4 sm:mt-14 sm:gap-5 lg:grid lg:grid-cols-3 lg:overflow-visible lg:pb-0"
				>
					{useCases.map((useCase, index) => {
						const Icon = useCase.icon;

						return (
							<article
								key={useCase.title}
								data-use-case-card
								className={`relative min-h-[27rem] w-[82vw] shrink-0 snap-start overflow-hidden rounded-lg p-6 shadow-sm sm:w-[24rem] sm:p-7 lg:w-auto ${useCase.surfaceClassName}`}
							>
								<div
									className={`absolute inset-x-6 top-0 h-1 rounded-full ${useCase.accentClassName}`}
									aria-hidden="true"
								/>
								<div className="flex min-h-full flex-col">
									<div className="flex items-start justify-between gap-5">
										<div>
											<p
												className={`text-sm font-semibold uppercase tracking-[0.16em] ${useCase.eyebrowClassName}`}
											>
												0{index + 1} / {useCase.eyebrow}
											</p>
											<p
												className={`mt-5 text-sm font-semibold ${useCase.metricClassName}`}
											>
												{useCase.metric}
											</p>
										</div>
										<div className="flex size-12 shrink-0 items-center justify-center rounded-full bg-white/80 text-[#1769ff] shadow-sm">
											<Icon className="size-5" aria-hidden="true" />
										</div>
									</div>

									<div className="mt-auto pt-16">
										<h3 className="text-2xl font-semibold leading-tight sm:text-3xl">
											{useCase.title}
										</h3>
										<p
											className={`mt-5 text-base leading-7 ${useCase.bodyClassName}`}
										>
											{useCase.body}
										</p>
									</div>
								</div>
							</article>
						);
					})}
				</div>
			</div>
		</section>
	);
}
