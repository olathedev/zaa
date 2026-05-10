import { r as __toESM } from "../_runtime.mjs";
import { n as gsapWithCSS, r as require_react, t as useGSAP } from "../_libs/gsap+gsap__react+react.mjs";
import { l as require_jsx_runtime } from "../_libs/@tanstack/react-router+[...].mjs";
import { t as ScrollTrigger } from "../_libs/gsap.mjs";
import { n as Minus, t as Plus } from "../_libs/lucide-react.mjs";
import { t as ReactLenis } from "../_libs/lenis.mjs";
//#region node_modules/.nitro/vite/services/ssr/assets/routes-v6b7KS5Q.js
var import_react = /* @__PURE__ */ __toESM(require_react());
var import_jsx_runtime = require_jsx_runtime();
function WhatsAppIcon({ className }) {
	return /* @__PURE__ */ (0, import_jsx_runtime.jsx)("svg", {
		className,
		viewBox: "0 0 32 32",
		fill: "none",
		"aria-hidden": "true",
		children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)("path", {
			fill: "currentColor",
			d: "M16 3.2A12.64 12.64 0 0 0 5.18 22.4L3.6 28.8l6.55-1.53A12.65 12.65 0 1 0 16 3.2Zm0 2.35a10.3 10.3 0 1 1-5.24 19.18l-.46-.27-3.42.8.82-3.32-.3-.48A10.3 10.3 0 0 1 16 5.55Zm-4.54 4.92c-.23 0-.58.08-.88.42-.3.34-1.16 1.13-1.16 2.76 0 1.62 1.19 3.2 1.35 3.42.16.23 2.3 3.7 5.68 5.04 2.81 1.1 3.39.88 4 .82.61-.05 1.98-.8 2.26-1.58.28-.78.28-1.45.2-1.59-.08-.14-.3-.22-.64-.39-.33-.16-1.98-.98-2.29-1.09-.3-.11-.52-.16-.74.17-.22.33-.86 1.08-1.05 1.3-.2.22-.39.25-.72.08-.33-.17-1.4-.52-2.67-1.65-.99-.88-1.66-1.97-1.85-2.3-.2-.33-.02-.51.15-.68.15-.15.33-.39.5-.58.16-.2.22-.33.33-.55.11-.22.05-.42-.03-.58-.08-.16-.72-1.78-1.02-2.42-.27-.58-.55-.6-.82-.61h-.6Z"
		})
	});
}
gsapWithCSS.registerPlugin(useGSAP, ScrollTrigger);
var phoneImage = {
	src: "/mobilechat1.png",
	alt: "Zaa ai WhatsApp chat on a phone",
	width: 361,
	height: 692
};
var features = [
	{
		id: "onboard",
		eyebrow: "01 / Onboard",
		title: "Onboard and get your Zaa Score.",
		body: "Get your Zaa Score and a worker virtual account inside WhatsApp in 5 minutes.",
		cta: "Try Zaa ai",
		phoneSide: "left",
		panelClassName: "bg-[#1769ff] text-white",
		titleClassName: "text-white",
		bodyClassName: "text-[#eaf2ff]",
		eyebrowClassName: "text-[#bfdbfe]",
		buttonClassName: "bg-white text-[#07111f] hover:bg-[#eaf2ff]",
		accentClassName: "bg-[#caff9a]",
		stickyTopClassName: "lg:top-24"
	},
	{
		id: "jobs",
		eyebrow: "02 / Jobs",
		title: "Get matched to jobs. Instantly.",
		body: "Employers post jobs in plain WhatsApp messages. Zaa parses them, ranks every eligible worker by score, distance, and availability, and returns the top 3 within seconds. Your score does the talking.",
		cta: "Find opportunities",
		phoneSide: "right",
		panelClassName: "bg-[#d8ffc3] text-[#07111f]",
		titleClassName: "text-[#07111f]",
		bodyClassName: "text-[#273244]",
		eyebrowClassName: "text-[#1769ff]",
		buttonClassName: "bg-[#1769ff] text-white hover:bg-[#0f56d9]",
		accentClassName: "bg-[#1769ff]",
		stickyTopClassName: "lg:top-28"
	},
	{
		id: "payments",
		eyebrow: "03 / Payments",
		title: "Get paid safely. Save automatically.",
		body: "Employers pay into Squad escrow. You do the job. Send a photo. Zaa's AI verifies completion and releases your payment: 90% to your wallet, 10% auto-saved. Every job builds your financial history.",
		cta: "Start safely",
		phoneSide: "left",
		panelClassName: "bg-[#07111f] text-white",
		titleClassName: "text-white",
		bodyClassName: "text-[#dbeafe]",
		eyebrowClassName: "text-[#93c5fd]",
		buttonClassName: "bg-white text-[#07111f] hover:bg-[#dbeafe]",
		accentClassName: "bg-[#1769ff]",
		stickyTopClassName: "lg:top-32"
	},
	{
		id: "financial-services",
		eyebrow: "04 / Financial access",
		title: "Turn work signals into financial access.",
		body: "Zaa connects traders and workers to credit, savings, insurance, and payments using alternative data and behavioural signals rather than traditional credit history.",
		cta: "Build your profile",
		phoneSide: "right",
		panelClassName: "bg-[#eef5ff] text-[#07111f]",
		titleClassName: "text-[#07111f]",
		bodyClassName: "text-[#475569]",
		eyebrowClassName: "text-[#175cd3]",
		buttonClassName: "bg-[#1d2230] text-white hover:bg-[#1769ff]",
		accentClassName: "bg-[#caff9a]",
		stickyTopClassName: "lg:top-36"
	}
];
function FeatureSections({ whatsappChatUrl }) {
	const sectionRef = (0, import_react.useRef)(null);
	useGSAP(() => {
		if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
		gsapWithCSS.utils.toArray("[data-feature-card]").forEach((card) => {
			const phone = card.querySelector("[data-feature-phone]");
			const copy = card.querySelectorAll("[data-feature-copy]");
			const accent = card.querySelector("[data-feature-accent]");
			const surface = card.querySelector("[data-feature-surface]");
			const side = card.dataset.phoneSide === "left" ? -1 : 1;
			if (surface) gsapWithCSS.from(surface, {
				y: 36,
				opacity: 0,
				duration: .42,
				ease: "power2.out",
				scrollTrigger: {
					trigger: card,
					start: "top 86%",
					toggleActions: "play none none reverse"
				}
			});
			if (phone) {
				gsapWithCSS.from(phone, {
					x: side * 34,
					y: 18,
					rotate: side * 1.8,
					opacity: 0,
					duration: .46,
					ease: "power2.out",
					scrollTrigger: {
						trigger: card,
						start: "top 76%",
						toggleActions: "play none none reverse"
					}
				});
				gsapWithCSS.to(phone, {
					y: -18,
					ease: "none",
					scrollTrigger: {
						trigger: card,
						start: "top bottom",
						end: "bottom top",
						scrub: .4
					}
				});
			}
			if (copy.length > 0) gsapWithCSS.from(copy, {
				y: 18,
				opacity: 0,
				duration: .36,
				ease: "power2.out",
				stagger: .06,
				scrollTrigger: {
					trigger: card,
					start: "top 76%",
					toggleActions: "play none none reverse"
				}
			});
			if (accent) gsapWithCSS.fromTo(accent, {
				scaleX: 0,
				transformOrigin: card.dataset.phoneSide === "left" ? "right center" : "left center"
			}, {
				scaleX: 1,
				duration: .42,
				ease: "power2.out",
				scrollTrigger: {
					trigger: card,
					start: "top 72%",
					toggleActions: "play none none reverse"
				}
			});
		});
	}, { scope: sectionRef });
	return /* @__PURE__ */ (0, import_jsx_runtime.jsx)("section", {
		ref: sectionRef,
		id: "features",
		className: "bg-white px-5 pb-8 pt-14 sm:px-8 sm:pt-20 lg:pb-12 lg:pt-28",
		children: /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
			className: "mx-auto max-w-7xl",
			children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
				className: "mb-8 max-w-3xl sm:mb-12 lg:mb-28",
				children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
					className: "text-sm font-medium uppercase tracking-[0.16em] text-[#175cd3]",
					children: "How Zaa works"
				}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("h2", {
					className: "mt-4 text-2xl font-semibold leading-tight text-[#07111f] sm:text-4xl",
					children: "Built around WhatsApp, work, and the financial identity people already earn every day."
				})]
			}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
				className: "space-y-6 sm:space-y-8 lg:space-y-0 lg:pb-16",
				children: features.map((feature, index) => /* @__PURE__ */ (0, import_jsx_runtime.jsx)(FeatureCard, {
					feature,
					index,
					whatsappChatUrl
				}, feature.id))
			})]
		})
	});
}
function FeatureCard({ feature, index, whatsappChatUrl }) {
	const phone = /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
		"data-feature-phone": true,
		className: `relative z-20 mx-auto flex w-full max-w-[13.5rem] justify-center sm:max-w-[15.5rem] lg:absolute lg:-top-24 lg:max-w-[20rem] xl:-top-28 xl:max-w-[21.5rem] ${feature.phoneSide === "left" ? "lg:left-[7%]" : "lg:right-[7%]"}`,
		children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
			className: "absolute inset-x-8 top-16 bottom-8 rounded-full bg-black/20 blur-3xl",
			"aria-hidden": "true"
		}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("img", {
			src: phoneImage.src,
			alt: phoneImage.alt,
			width: phoneImage.width,
			height: phoneImage.height,
			className: "relative z-10 h-auto w-full drop-shadow-[0_28px_38px_rgba(15,23,42,0.22)]"
		})]
	});
	const copy = /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
		className: `relative z-10 max-w-2xl ${feature.phoneSide === "left" ? "lg:ml-[43%]" : "lg:mr-[43%]"}`,
		children: [
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
				"data-feature-copy": true,
				className: `text-sm font-semibold uppercase tracking-[0.16em] ${feature.eyebrowClassName}`,
				children: feature.eyebrow
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)("h3", {
				"data-feature-copy": true,
				className: `mt-5 text-2xl font-semibold leading-tight sm:text-4xl lg:text-5xl ${feature.titleClassName}`,
				children: feature.title
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
				"data-feature-copy": true,
				className: `mt-5 text-base leading-7 sm:mt-6 sm:leading-8 sm:text-lg ${feature.bodyClassName}`,
				children: feature.body
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("a", {
				"data-feature-copy": true,
				href: whatsappChatUrl,
				className: `mt-7 inline-flex min-h-12 w-full items-center justify-center gap-2 rounded-lg px-6 text-base font-medium transition-colors duration-150 ease-out motion-safe:transition-transform motion-safe:hover:-translate-y-0.5 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#1769ff] focus-visible:ring-offset-4 sm:w-fit ${feature.buttonClassName}`,
				children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(WhatsAppIcon, { className: "size-4" }), feature.cta]
			})
		]
	});
	return /* @__PURE__ */ (0, import_jsx_runtime.jsx)("article", {
		"data-feature-card": true,
		"data-phone-side": feature.phoneSide,
		className: `relative lg:sticky lg:mb-24 last:lg:mb-0 xl:mb-28 ${feature.stickyTopClassName}`,
		style: { zIndex: index + 1 },
		children: /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
			"data-feature-surface": true,
			className: `relative rounded-[1.5rem] px-5 py-8 shadow-sm sm:rounded-[2rem] sm:px-10 sm:py-10 lg:px-16 lg:py-20 ${feature.panelClassName}`,
			children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
				"data-feature-accent": true,
				className: `absolute inset-x-8 top-0 h-1 rounded-full ${feature.accentClassName}`
			}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
				className: "grid gap-8 lg:block",
				children: [phone, copy]
			})]
		})
	});
}
gsapWithCSS.registerPlugin(useGSAP, ScrollTrigger);
var faqs = [
	{
		question: "What is Zaa ai?",
		answer: "Zaa ai is a conversational AI layer that helps workers, traders, artisans, and job seekers access opportunities, financial services, and simple work tools through WhatsApp."
	},
	{
		question: "Who is Zaa built for?",
		answer: "It is built for people in the informal economy: market traders, service workers, artisans, delivery workers, apprentices, and young people looking for work or income opportunities."
	},
	{
		question: "What is a Zaa Score?",
		answer: "Your Zaa Score is a living profile built from verified work activity, reliability, completed jobs, savings behavior, and other alternative signals. It helps you stand out without needing traditional credit history."
	},
	{
		question: "Do users need to download another app?",
		answer: "No. Zaa starts inside WhatsApp. Users can onboard, answer questions, receive matches, build a profile, and access services through a familiar chat experience."
	},
	{
		question: "How does job matching work?",
		answer: "Employers can post jobs in plain WhatsApp messages. Zaa reads the request, checks eligible workers by score, distance, and availability, then returns the best matches quickly."
	},
	{
		question: "How do safe payments work?",
		answer: "For supported jobs, payments can move through escrow. The worker completes the job, submits proof, and Zaa helps verify completion before funds are released."
	},
	{
		question: "How does Zaa connect people to financial services?",
		answer: "Zaa uses alternative data and behavioural signals from real work activity to help workers and traders access credit, savings, insurance, and payments."
	}
];
function FaqSection() {
	const sectionRef = (0, import_react.useRef)(null);
	const [openQuestion, setOpenQuestion] = (0, import_react.useState)(faqs[0].question);
	useGSAP(() => {
		if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
		gsapWithCSS.from("[data-faq-reveal]", {
			y: 28,
			opacity: 0,
			duration: .42,
			ease: "power2.out",
			stagger: .06,
			scrollTrigger: {
				trigger: sectionRef.current,
				start: "top 74%",
				toggleActions: "play none none reverse"
			}
		});
	}, { scope: sectionRef });
	return /* @__PURE__ */ (0, import_jsx_runtime.jsx)("section", {
		ref: sectionRef,
		id: "faq",
		className: "bg-white px-5 py-14 sm:px-8 sm:py-20 lg:py-28",
		children: /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
			className: "mx-auto max-w-5xl",
			children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
				"data-faq-reveal": true,
				className: "mx-auto mb-10 text-center sm:mb-16 lg:mb-20",
				children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)("h2", {
					className: "text-3xl font-semibold leading-tight tracking-[-0.01em] text-[#1d2230] sm:text-5xl lg:text-6xl",
					children: "Frequently Asked Questions"
				})
			}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
				"data-faq-reveal": true,
				children: faqs.map((faq, index) => {
					const isOpen = openQuestion === faq.question;
					const itemId = `faq-${faq.question.toLowerCase().replaceAll(" ", "-")}`;
					return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
						className: "border-b border-[#edf1f6] first:border-t",
						children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("button", {
							type: "button",
							"aria-expanded": isOpen,
							"aria-controls": itemId,
							onClick: () => setOpenQuestion(isOpen ? "" : faq.question),
							className: "flex min-h-18 w-full items-center justify-between gap-4 px-0 py-5 text-left text-base font-semibold text-black transition-colors duration-150 ease-out hover:text-[#1769ff] focus-visible:rounded-lg focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#1769ff] focus-visible:ring-offset-4 sm:min-h-24 sm:px-8 sm:py-7 sm:text-xl",
							children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("span", { children: [
								index + 1,
								". ",
								faq.question
							] }), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
								className: "flex size-8 shrink-0 items-center justify-center text-black sm:size-10",
								children: isOpen ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Minus, {
									className: "size-5 sm:size-6",
									"aria-hidden": "true"
								}) : /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Plus, {
									className: "size-5 sm:size-6",
									"aria-hidden": "true"
								})
							})]
						}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
							id: itemId,
							className: `grid transition-[grid-template-rows] duration-200 ease-out ${isOpen ? "grid-rows-[1fr]" : "grid-rows-[0fr]"}`,
							children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
								className: "overflow-hidden",
								children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
									className: "max-w-3xl pb-6 text-sm leading-7 text-[#475569] sm:px-8 sm:pb-8 sm:text-lg sm:leading-8",
									children: faq.answer
								})
							})
						})]
					}, faq.question);
				})
			})]
		})
	});
}
var footerLinks = [
	{
		label: "Terms",
		href: "#terms"
	},
	{
		label: "Privacy Policy",
		href: "#privacy"
	},
	{
		label: "Twitter",
		href: "#twitter"
	},
	{
		label: "Facebook",
		href: "#facebook"
	}
];
function FooterSection() {
	return /* @__PURE__ */ (0, import_jsx_runtime.jsx)("footer", {
		className: "relative overflow-hidden bg-[#f8f9fb] px-5 pb-0 pt-12 sm:px-8 sm:pt-16 lg:pt-24",
		children: /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
			className: "mx-auto max-w-7xl",
			children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
				className: "flex flex-col gap-6 sm:flex-row sm:items-start sm:justify-between",
				children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("nav", {
					"aria-label": "Footer navigation",
					className: "flex flex-wrap items-center gap-x-6 gap-y-3 sm:gap-x-10 sm:gap-y-4",
					children: footerLinks.map((link) => /* @__PURE__ */ (0, import_jsx_runtime.jsx)("a", {
						href: link.href,
						className: "text-base font-medium text-[#111827] transition-colors duration-150 ease-out hover:text-[#1769ff] focus-visible:rounded-md focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#1769ff] focus-visible:ring-offset-4 sm:text-lg",
						children: link.label
					}, link.label))
				}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
					className: "text-sm font-semibold text-[#8b94a3] sm:text-lg",
					children: "© 2026 copyright all rights reserved."
				})]
			}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
				className: "mt-12 flex h-[8rem] items-end overflow-hidden sm:mt-20 sm:h-[17rem] lg:mt-28 lg:h-[20rem]",
				children: /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
					className: "flex min-w-full items-end justify-center gap-[3vw]",
					children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
						className: "mb-1 flex items-end gap-[1.4vw]",
						"aria-hidden": "true",
						children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", { className: "block h-[clamp(4.5rem,17vw,16rem)] w-[clamp(1.4rem,4vw,4.4rem)] skew-x-[-8deg] rounded-t-lg bg-[#0f51ff]" }), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", { className: "block h-[clamp(4.5rem,17vw,16rem)] w-[clamp(1.4rem,4vw,4.4rem)] skew-x-[-8deg] rounded-t-lg bg-[#0f51ff]" })]
					}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
						className: "select-none text-[clamp(5.8rem,26vw,24rem)] font-extrabold leading-[0.65] tracking-[-0.08em] text-[#a8aaad]",
						children: "zaa"
					})]
				})
			})]
		})
	});
}
gsapWithCSS.registerPlugin(useGSAP);
var heroImages = {
	worker: {
		src: "/worker.jpg",
		alt: "Informal worker serving customers at a market",
		width: 1600,
		height: 1066
	},
	worker1: {
		src: "/worker1.jpg",
		alt: "Skilled worker focused on hands-on craft",
		width: 4e3,
		height: 6e3
	},
	worker2: {
		src: "/worker2.jpg",
		alt: "Young worker building a livelihood through daily work",
		width: 3064,
		height: 5456
	},
	worker3: {
		src: "/worker3.webp",
		alt: "People working in the informal economy",
		width: 612,
		height: 408
	},
	worker4: {
		src: "/worker.png",
		alt: "Worker using technology to access new opportunities",
		width: 1408,
		height: 768
	}
};
function HeroSection({ whatsappChatUrl }) {
	const sectionRef = (0, import_react.useRef)(null);
	useGSAP(() => {
		if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
		gsapWithCSS.from("[data-hero-intro]", {
			y: 18,
			opacity: 0,
			duration: .45,
			ease: "power2.out",
			stagger: .07
		});
		gsapWithCSS.from("[data-hero-image]", {
			y: 22,
			opacity: 0,
			scale: .985,
			duration: .5,
			ease: "power2.out",
			stagger: .06,
			delay: .12
		});
	}, { scope: sectionRef });
	return /* @__PURE__ */ (0, import_jsx_runtime.jsx)("section", {
		ref: sectionRef,
		className: "bg-white",
		children: /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
			className: "mx-auto max-w-7xl px-5 pb-14 pt-10 sm:px-8 sm:pb-20 lg:pb-28 lg:pt-18",
			children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
				className: "grid gap-8 lg:grid-cols-[0.95fr_0.72fr] lg:items-end lg:gap-16",
				children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", { children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
					"data-hero-intro": true,
					className: "mb-5 inline-flex min-h-9 items-center rounded-full bg-[#eef5ff] px-4 text-sm font-medium text-[#175cd3]",
					children: "AI infrastructure for inclusive economic participation"
				}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("h1", {
					"data-hero-intro": true,
					className: "max-w-4xl text-[2.35rem] font-semibold leading-[1.08] tracking-[-0.01em] text-[#07111f] sm:text-4xl lg:text-[3.1rem]",
					children: "Connecting informal workers to opportunity through AI."
				})] }), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
					className: "max-w-xl lg:pb-2",
					children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
						"data-hero-intro": true,
						className: "text-base leading-7 text-[#475569]",
						children: "Zaa ai connects workers, traders, artisans, and job seekers to the opportunities and financial services they need through conversational AI."
					}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
						"data-hero-intro": true,
						className: "mt-7 flex flex-col gap-3 min-[430px]:flex-row lg:flex-col xl:flex-row",
						children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("a", {
							href: whatsappChatUrl,
							className: "inline-flex min-h-12 items-center justify-center gap-2 rounded-lg bg-[#1769ff] px-6 text-base font-medium text-white transition-colors duration-150 ease-out hover:bg-[#0f56d9] motion-safe:transition-transform motion-safe:hover:-translate-y-0.5 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#1769ff] focus-visible:ring-offset-4",
							children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(WhatsAppIcon, { className: "size-4" }), "Try Zaa ai"]
						}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("a", {
							href: "#use-cases",
							className: "inline-flex min-h-12 items-center justify-center rounded-lg border border-[#d7e2f0] px-6 text-base font-medium text-[#0f172a] transition-colors duration-150 ease-out hover:border-[#1769ff] hover:text-[#1769ff] motion-safe:transition-transform motion-safe:hover:-translate-y-0.5 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#1769ff] focus-visible:ring-offset-4",
							children: "Explore the platform"
						})]
					})]
				})]
			}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
				className: "mt-10 grid gap-4 sm:grid-cols-2 lg:mt-14 lg:grid-cols-[1.2fr_0.72fr_0.58fr] lg:gap-5",
				children: [
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)(ImageTile, {
						image: heroImages.worker,
						className: "min-h-[260px] sm:col-span-2 sm:min-h-[420px] lg:col-span-1 lg:min-h-[520px]"
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
						className: "grid gap-4 sm:grid-cols-2 lg:grid-cols-1 lg:gap-5",
						children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(ImageTile, {
							image: heroImages.worker1,
							className: "min-h-[220px] lg:min-h-0",
							objectPosition: "center 35%"
						}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
							"data-hero-image": true,
							className: "group relative min-h-[220px] overflow-hidden rounded-lg border border-[#d7e2f0] bg-[#07111f] p-5 text-white motion-safe:transition-transform motion-safe:duration-150 motion-safe:ease-out motion-safe:hover:-translate-y-1 lg:min-h-0",
							children: [
								/* @__PURE__ */ (0, import_jsx_runtime.jsx)("img", {
									src: heroImages.worker4.src,
									alt: heroImages.worker4.alt,
									width: heroImages.worker4.width,
									height: heroImages.worker4.height,
									className: "absolute inset-0 h-full w-full object-cover opacity-40 motion-safe:transition-transform motion-safe:duration-300 motion-safe:ease-out motion-safe:group-hover:scale-[1.03]"
								}),
								/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
									className: "absolute inset-0 bg-[#07111f]/55",
									"aria-hidden": "true"
								}),
								/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
									className: "relative",
									children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
										className: "text-sm font-medium uppercase tracking-[0.16em] text-[#93c5fd]",
										children: "Opportunity layer"
									}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
										className: "mt-4 text-2xl font-semibold leading-tight text-white",
										children: "One intelligent bridge between people, work, and financial access."
									})]
								})
							]
						})]
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
						className: "grid gap-4 sm:grid-cols-2 lg:grid-cols-1 lg:gap-5",
						children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
							"data-hero-image": true,
							className: "relative min-h-[220px] overflow-hidden rounded-lg bg-[#07111f] p-5 text-white motion-safe:transition-transform motion-safe:duration-150 motion-safe:ease-out motion-safe:hover:-translate-y-1 lg:min-h-0",
							children: [
								/* @__PURE__ */ (0, import_jsx_runtime.jsx)("img", {
									src: heroImages.worker3.src,
									alt: heroImages.worker3.alt,
									width: heroImages.worker3.width,
									height: heroImages.worker3.height,
									className: "absolute inset-0 h-full w-full object-cover opacity-35"
								}),
								/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
									className: "absolute inset-0 bg-[#07111f]/55",
									"aria-hidden": "true"
								}),
								/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
									className: "relative",
									children: [
										/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
											className: "text-sm font-medium text-[#93c5fd]",
											children: "Signal"
										}),
										/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
											className: "mt-10 text-3xl font-semibold",
											children: "Millions"
										}),
										/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
											className: "mt-2 text-sm leading-6 text-[#dbeafe]",
											children: "of workers, traders, and job seekers still need a simpler path into opportunity."
										})
									]
								})
							]
						}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)(ImageTile, {
							image: heroImages.worker2,
							className: "min-h-[260px] lg:min-h-0",
							objectPosition: "center 38%"
						})]
					})
				]
			})]
		})
	});
}
function ImageTile({ image, className, objectPosition = "center" }) {
	return /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
		"data-hero-image": true,
		className: `${className} group overflow-hidden rounded-lg bg-[#eef5ff] shadow-sm motion-safe:transition-transform motion-safe:duration-150 motion-safe:ease-out motion-safe:hover:-translate-y-1`,
		children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)("img", {
			src: image.src,
			alt: image.alt,
			width: image.width,
			height: image.height,
			className: "h-full w-full object-cover motion-safe:transition-transform motion-safe:duration-300 motion-safe:ease-out motion-safe:group-hover:scale-[1.03]",
			style: { objectPosition }
		})
	});
}
function SmoothScroll({ children }) {
	const [disableSmoothScroll, setDisableSmoothScroll] = (0, import_react.useState)(true);
	(0, import_react.useEffect)(() => {
		const reducedMotionQuery = window.matchMedia("(prefers-reduced-motion: reduce)");
		const mobileQuery = window.matchMedia("(max-width: 767px)");
		const updateScrollPreference = () => {
			setDisableSmoothScroll(reducedMotionQuery.matches || mobileQuery.matches);
		};
		updateScrollPreference();
		reducedMotionQuery.addEventListener("change", updateScrollPreference);
		mobileQuery.addEventListener("change", updateScrollPreference);
		return () => {
			reducedMotionQuery.removeEventListener("change", updateScrollPreference);
			mobileQuery.removeEventListener("change", updateScrollPreference);
		};
	}, []);
	if (disableSmoothScroll) return children;
	return /* @__PURE__ */ (0, import_jsx_runtime.jsx)(ReactLenis, {
		root: true,
		options: {
			autoRaf: true,
			duration: 1.05,
			easing: (time) => Math.min(1, 1.001 - 2 ** (-10 * time)),
			lerp: .09,
			wheelMultiplier: .9
		},
		children
	});
}
var navItems = [
	"Use Cases",
	"Features",
	"FAQ"
];
function SiteHeader({ whatsappChatUrl }) {
	return /* @__PURE__ */ (0, import_jsx_runtime.jsx)("header", {
		className: "border-t-4 border-[#173f35] bg-white",
		children: /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("nav", {
			"aria-label": "Primary navigation",
			className: "mx-auto grid min-h-20 max-w-7xl grid-cols-[1fr_auto] items-center gap-x-4 gap-y-3 px-5 py-4 sm:px-8 lg:min-h-24 lg:grid-cols-[auto_1fr_auto] lg:gap-8 lg:py-0",
			children: [
				/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("a", {
					href: "/",
					"aria-label": "Zaa AI home",
					className: "flex min-h-10 items-center gap-2 text-[1.45rem] font-semibold tracking-normal text-[#020617] focus-visible:rounded-md focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#1769ff] focus-visible:ring-offset-4 sm:text-[1.7rem]",
					children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("span", {
						className: "flex items-center gap-0.5",
						"aria-hidden": "true",
						children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", { className: "h-3.5 w-1.5 skew-x-[-18deg] rounded-sm bg-[#1769ff]" }), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", { className: "h-4.5 w-1.5 skew-x-[-18deg] rounded-sm bg-[#1769ff]" })]
					}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", { children: "Zaa ai." })]
				}),
				/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
					className: "order-3 col-span-2 flex items-center justify-center gap-5 overflow-x-auto border-t border-[#eef2f7] pt-3 pb-1 lg:order-none lg:col-span-1 lg:justify-center lg:gap-9 lg:overflow-visible lg:border-t-0 lg:pt-0 lg:pb-0",
					children: navItems.map((item) => /* @__PURE__ */ (0, import_jsx_runtime.jsx)("a", {
						href: `#${item.toLowerCase().replaceAll(" ", "-")}`,
						className: "min-h-10 shrink-0 content-center text-[0.95rem] font-medium text-[#0f172a] transition-colors hover:text-[#1769ff] focus-visible:rounded-md focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#1769ff] focus-visible:ring-offset-4 lg:text-base",
						children: item
					}, item))
				}),
				/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("a", {
					href: whatsappChatUrl,
					className: "inline-flex min-h-11 w-fit items-center justify-center gap-2 rounded-lg bg-[#1d2230] px-4 text-sm font-medium text-white shadow-sm transition-colors hover:bg-[#1769ff] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#1769ff] focus-visible:ring-offset-4 lg:min-h-12 lg:px-6 lg:text-base",
					children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(WhatsAppIcon, { className: "size-4" }), "Try now"]
				})
			]
		})
	});
}
var whatsappChatUrl = "#start-chat";
function LandingPage() {
	return /* @__PURE__ */ (0, import_jsx_runtime.jsx)(SmoothScroll, { children: /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("main", {
		className: "min-h-screen bg-white text-[#111827]",
		children: [
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)(SiteHeader, { whatsappChatUrl }),
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)(HeroSection, { whatsappChatUrl }),
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)(FeatureSections, { whatsappChatUrl }),
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)(FaqSection, {}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)(FooterSection, {})
		]
	}) });
}
var SplitComponent = LandingPage;
//#endregion
export { SplitComponent as component };
