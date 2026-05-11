import { useGSAP } from "@gsap/react";
import gsap from "gsap";
import { useEffect, useRef, useState } from "react";

import { WhatsAppIcon } from "./whatsapp-icon";

gsap.registerPlugin(useGSAP);

type HeroImage = {
	src: string;
	alt: string;
	width: number;
	height: number;
};

const heroImages = {
	worker: {
		src: "/worker.jpg",
		alt: "Informal worker serving customers at a market",
		width: 1600,
		height: 1066,
	},
	worker1: {
		src: "/worker1.jpg",
		alt: "Skilled worker focused on hands-on craft",
		width: 4000,
		height: 6000,
	},
	worker2: {
		src: "/worker2.jpg",
		alt: "Young worker building a livelihood through daily work",
		width: 3064,
		height: 5456,
	},
	worker3: {
		src: "/worker3.webp",
		alt: "People working in the informal economy",
		width: 612,
		height: 408,
	},
	worker4: {
		src: "/worker4.jpg",
		alt: "Worker standing confidently in a busy local environment",
		width: 2268,
		height: 4032,
	},
	worker5: {
		src: "/worker5.jpg",
		alt: "Worker preparing goods for customers",
		width: 3840,
		height: 5760,
	},
	workerTechnology: {
		src: "/worker.png",
		alt: "Worker using technology to access new opportunities",
		width: 1408,
		height: 768,
	},
} satisfies Record<string, HeroImage>;

const HERO_IMAGE_CHANGE_DELAY_MS = 5600;
const HERO_IMAGE_TRANSITION_MS = 1400;

const heroImageGroups = {
	main: [heroImages.worker, heroImages.worker4, heroImages.worker5],
	craft: [heroImages.worker1, heroImages.worker5, heroImages.worker4],
	opportunity: [
		heroImages.workerTechnology,
		heroImages.worker4,
		heroImages.worker5,
	],
	signal: [heroImages.worker3, heroImages.worker5, heroImages.worker4],
	livelihood: [heroImages.worker2, heroImages.worker4, heroImages.worker5],
} satisfies Record<string, HeroImage[]>;

export function HeroSection({ whatsappChatUrl }: { whatsappChatUrl: string }) {
	const sectionRef = useRef<HTMLElement>(null);
	const [activeImageStep, setActiveImageStep] = useState(0);

	useEffect(() => {
		if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
			return;
		}

		const intervalId = window.setInterval(() => {
			setActiveImageStep((currentStep) => currentStep + 1);
		}, HERO_IMAGE_CHANGE_DELAY_MS);

		return () => window.clearInterval(intervalId);
	}, []);

	useGSAP(
		() => {
			if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
				return;
			}

			gsap.from("[data-hero-intro]", {
				y: 18,
				opacity: 0,
				duration: 0.45,
				ease: "power2.out",
				stagger: 0.07,
			});

			gsap.from("[data-hero-image]", {
				y: 22,
				opacity: 0,
				scale: 0.985,
				duration: 0.5,
				ease: "power2.out",
				stagger: 0.06,
				delay: 0.12,
			});
		},
		{ scope: sectionRef },
	);

	return (
		<section ref={sectionRef} className="bg-white">
			<div className="mx-auto max-w-7xl px-5 pb-14 pt-10 sm:px-8 sm:pb-20 lg:pb-28 lg:pt-18">
				<div className="grid gap-8 lg:grid-cols-[0.95fr_0.72fr] lg:items-end lg:gap-16">
					<div>
						<p
							data-hero-intro
							className="mb-5 inline-flex min-h-9 items-center rounded-full bg-[#eef5ff] px-4 text-sm font-medium text-[#175cd3]"
						>
							AI infrastructure for inclusive economic participation
						</p>

						<h1
							data-hero-intro
							className="max-w-4xl text-[2.35rem] font-semibold leading-[1.08] tracking-[-0.01em] text-[#07111f] sm:text-4xl lg:text-[3.1rem]"
						>
							Connecting informal workers to opportunity through AI.
						</h1>
					</div>

					<div className="max-w-xl lg:pb-2">
						<p data-hero-intro className="text-base leading-7 text-[#475569]">
							Zaa ai connects workers, traders, artisans, and job seekers to the
							opportunities and financial services they need through
							conversational AI.
						</p>

						<div
							data-hero-intro
							className="mt-7 flex flex-col gap-3 min-[430px]:flex-row lg:flex-col xl:flex-row"
						>
							<a
								href={whatsappChatUrl}
								className="inline-flex min-h-12 items-center justify-center gap-2 rounded-lg bg-[#1769ff] px-6 text-base font-medium text-white transition-colors duration-150 ease-out hover:bg-[#0f56d9] motion-safe:transition-transform motion-safe:hover:-translate-y-0.5 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#1769ff] focus-visible:ring-offset-4"
							>
								<WhatsAppIcon className="size-4" />
								Try Zaa ai
							</a>
						</div>
					</div>
				</div>

				<div className="mt-10 grid gap-4 sm:grid-cols-2 lg:mt-14 lg:grid-cols-[1.2fr_0.72fr_0.58fr] lg:gap-5">
					<ImageTile
						images={heroImageGroups.main}
						activeImageIndex={activeImageStep}
						className="min-h-[260px] sm:col-span-2 sm:min-h-[420px] lg:col-span-1 lg:min-h-[520px]"
					/>
					<div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-1 lg:gap-5">
						<ImageTile
							images={heroImageGroups.craft}
							activeImageIndex={activeImageStep + 1}
							className="min-h-[220px] lg:min-h-0"
							objectPosition="center 35%"
							transitionDelayMs={80}
						/>
						<div
							data-hero-image
							className="group relative min-h-[220px] overflow-hidden rounded-lg border border-[#d7e2f0] bg-[#07111f] p-5 text-white motion-safe:transition-transform motion-safe:duration-150 motion-safe:ease-out motion-safe:hover:-translate-y-1 lg:min-h-0"
						>
							<ImageStack
								images={heroImageGroups.opportunity}
								activeImageIndex={activeImageStep + 2}
								imageOpacity={0.4}
								transitionDelayMs={120}
							/>
							<div
								className="absolute inset-0 bg-[#07111f]/55"
								aria-hidden="true"
							/>
							<div className="relative">
								<p className="text-sm font-medium uppercase tracking-[0.16em] text-[#93c5fd]">
									Opportunity layer
								</p>
								<p className="mt-4 text-2xl font-semibold leading-tight text-white">
									One intelligent bridge between people, work, and financial
									access.
								</p>
							</div>
						</div>
					</div>
					<div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-1 lg:gap-5">
						<div
							data-hero-image
							className="relative min-h-[220px] overflow-hidden rounded-lg bg-[#07111f] p-5 text-white motion-safe:transition-transform motion-safe:duration-150 motion-safe:ease-out motion-safe:hover:-translate-y-1 lg:min-h-0"
						>
							<ImageStack
								images={heroImageGroups.signal}
								activeImageIndex={activeImageStep + 3}
								imageOpacity={0.35}
								transitionDelayMs={220}
							/>
							<div
								className="absolute inset-0 bg-[#07111f]/55"
								aria-hidden="true"
							/>
							<div className="relative">
								<p className="text-sm font-medium text-[#93c5fd]">Signal</p>
								<p className="mt-10 text-3xl font-semibold">Millions</p>
								<p className="mt-2 text-sm leading-6 text-[#dbeafe]">
									of workers, traders, and job seekers still need a simpler path
									into opportunity.
								</p>
							</div>
						</div>
						<ImageTile
							images={heroImageGroups.livelihood}
							activeImageIndex={activeImageStep + 4}
							className="min-h-[260px] lg:min-h-0"
							objectPosition="center 38%"
							transitionDelayMs={300}
						/>
					</div>
				</div>
			</div>
		</section>
	);
}

function ImageTile({
	images,
	activeImageIndex,
	className,
	objectPosition = "center",
	transitionDelayMs = 0,
}: {
	images: HeroImage[];
	activeImageIndex: number;
	className: string;
	objectPosition?: string;
	transitionDelayMs?: number;
}) {
	return (
		<div
			data-hero-image
			className={`${className} group relative overflow-hidden rounded-lg bg-[#eef5ff] shadow-sm motion-safe:transition-transform motion-safe:duration-150 motion-safe:ease-out motion-safe:hover:-translate-y-1`}
		>
			<ImageStack
				images={images}
				activeImageIndex={activeImageIndex}
				objectPosition={objectPosition}
				transitionDelayMs={transitionDelayMs}
			/>
		</div>
	);
}

function ImageStack({
	images,
	activeImageIndex,
	objectPosition = "center",
	imageOpacity = 1,
	transitionDelayMs = 0,
}: {
	images: HeroImage[];
	activeImageIndex: number;
	objectPosition?: string;
	imageOpacity?: number;
	transitionDelayMs?: number;
}) {
	const normalizedActiveImageIndex = activeImageIndex % images.length;

	return (
		<>
			{images.map((image, imageIndex) => {
				const isActive = imageIndex === normalizedActiveImageIndex;

				return (
					<img
						key={image.src}
						src={image.src}
						alt={isActive ? image.alt : ""}
						width={image.width}
						height={image.height}
						aria-hidden={isActive ? undefined : true}
						className="absolute inset-0 h-full w-full object-cover will-change-[opacity,transform]"
						style={{
							filter: isActive
								? "saturate(1) contrast(1)"
								: "saturate(0.92) contrast(0.96)",
							objectPosition,
							opacity: isActive ? imageOpacity : 0,
							transform: isActive
								? "translate3d(0, 0, 0) scale(1.035)"
								: "translate3d(0, 10px, 0) scale(1.01)",
							transition: `opacity ${HERO_IMAGE_TRANSITION_MS}ms cubic-bezier(0.4, 0, 0.2, 1), transform ${HERO_IMAGE_TRANSITION_MS + 300}ms cubic-bezier(0.4, 0, 0.2, 1), filter ${HERO_IMAGE_TRANSITION_MS}ms cubic-bezier(0.4, 0, 0.2, 1)`,
							transitionDelay: `${transitionDelayMs}ms`,
							zIndex: isActive ? 2 : 1,
						}}
					/>
				);
			})}
		</>
	);
}
