import { useGSAP } from "@gsap/react";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { Minus, Plus } from "lucide-react";
import { type CSSProperties, useRef, useState } from "react";

gsap.registerPlugin(useGSAP, ScrollTrigger);

const faqs = [
	{
		question: "What is Zaa ai?",
		answer:
			"Zaa ai is a conversational AI layer that helps workers, traders, artisans, and job seekers access opportunities, financial services, and simple work tools through WhatsApp.",
	},
	{
		question: "Who is Zaa built for?",
		answer:
			"It is built for people in the informal economy: market traders, service workers, artisans, delivery workers, apprentices, and young people looking for work or income opportunities.",
	},
	{
		question: "What is a Zaa Score?",
		answer:
			"Your Zaa Score is a living profile built from verified work activity, reliability, completed jobs, savings behavior, and other alternative signals. It helps you stand out without needing traditional credit history.",
	},
	{
		question: "Do users need to download another app?",
		answer:
			"No. Zaa starts inside WhatsApp. Users can onboard, answer questions, receive matches, build a profile, and access services through a familiar chat experience.",
	},
	{
		question: "How does job matching work?",
		answer:
			"Employers can post jobs in plain WhatsApp messages. Zaa reads the request, checks eligible workers by score, distance, and availability, then returns the best matches quickly.",
	},
	{
		question: "How do safe payments work?",
		answer:
			"For supported jobs, payments can move through escrow. The worker completes the job, submits proof, and Zaa helps verify completion before funds are released.",
	},
	{
		question: "How does Zaa connect people to financial services?",
		answer:
			"Zaa uses alternative data and behavioural signals from real work activity to help workers and traders access credit, savings, insurance, and payments.",
	},
];

export function FaqSection() {
	const sectionRef = useRef<HTMLElement>(null);
	const [openQuestion, setOpenQuestion] = useState(faqs[0].question);

	useGSAP(
		() => {
			if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
				return;
			}

			gsap.from("[data-faq-reveal]", {
				y: 28,
				opacity: 0,
				duration: 0.42,
				ease: "power2.out",
				stagger: 0.06,
				scrollTrigger: {
					trigger: sectionRef.current,
					start: "top 74%",
					toggleActions: "play none none reverse",
				},
			});
		},
		{ scope: sectionRef },
	);

	return (
		<section
			ref={sectionRef}
			id="faq"
			className="bg-white px-5 py-14 sm:px-8 sm:py-20 lg:py-28"
		>
			<div className="mx-auto max-w-5xl">
				<div
					data-faq-reveal
					className="mx-auto mb-10 text-center sm:mb-16 lg:mb-20"
				>
					<h2 className="text-3xl font-semibold leading-tight tracking-[-0.01em] text-[#1d2230] sm:text-5xl lg:text-6xl">
						Frequently Asked Questions
					</h2>
				</div>

				<div
					data-faq-reveal
					className="rounded-lg border border-[#edf1f6] bg-white shadow-sm"
				>
					{faqs.map((faq, index) => {
						const isOpen = openQuestion === faq.question;
						const itemId = `faq-${faq.question.toLowerCase().replaceAll(" ", "-")}`;

						return (
							<div
								key={faq.question}
								className={`border-b border-[#edf1f6] last:border-b-0 ${isOpen ? "bg-[#f8fbff]" : "bg-white"}`}
							>
								<button
									type="button"
									aria-expanded={isOpen}
									aria-controls={itemId}
									onClick={() => setOpenQuestion(isOpen ? "" : faq.question)}
									className="group flex min-h-18 w-full items-center justify-between gap-4 px-5 py-5 text-left text-base font-semibold text-[#07111f] transition-colors duration-150 ease-out hover:text-[#1769ff] focus-visible:rounded-lg focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#1769ff] focus-visible:ring-offset-4 sm:min-h-24 sm:px-8 sm:py-7 sm:text-xl"
								>
									<span className="flex items-center gap-4">
										<span
											className={`flex size-8 shrink-0 items-center justify-center rounded-full text-sm font-semibold transition-colors duration-150 ease-out ${
												isOpen
													? "bg-[#1769ff] text-white"
													: "bg-[#eef5ff] text-[#175cd3] group-hover:bg-[#dbeafe]"
											}`}
										>
											{index + 1}
										</span>
										<span>{faq.question}</span>
									</span>
									<span className="flex size-8 shrink-0 items-center justify-center text-[#07111f] transition-colors duration-150 ease-out group-hover:text-[#1769ff] sm:size-10">
										{isOpen ? (
											<Minus className="size-5 sm:size-6" aria-hidden="true" />
										) : (
											<Plus className="size-5 sm:size-6" aria-hidden="true" />
										)}
									</span>
								</button>
								<div
									id={itemId}
									className={`grid transition-[grid-template-rows] duration-200 ease-out ${isOpen ? "grid-rows-[1fr]" : "grid-rows-[0fr]"}`}
								>
									<div className="overflow-hidden">
										<div className="max-w-3xl px-5 pb-6 pl-[4.25rem] text-sm leading-7 text-[#475569] sm:px-8 sm:pb-8 sm:pl-24 sm:text-lg sm:leading-8">
											{isOpen ? (
												<WrittenAnswer key={faq.question} text={faq.answer} />
											) : null}
										</div>
									</div>
								</div>
							</div>
						);
					})}
				</div>
			</div>
		</section>
	);
}

function WrittenAnswer({ text }: { text: string }) {
	let wordIndex = -1;

	return (
		<p>
			{text.split(/(\s+)/).map((token, tokenIndex) => {
				if (/^\s+$/.test(token)) {
					return token;
				}

				wordIndex += 1;

				return (
					<span
						// biome-ignore lint/suspicious/noArrayIndexKey: The text is static and only remounts to replay the writing effect.
						key={`${token}-${tokenIndex}`}
						className="faq-written-word inline-block"
						style={{ "--word-delay": `${wordIndex * 42}ms` } as CSSProperties}
					>
						{token}
					</span>
				);
			})}
			<span className="faq-writing-caret" aria-hidden="true" />
		</p>
	);
}
