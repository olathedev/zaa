import { useRef } from 'react'

import { useGSAP } from '@gsap/react'
import gsap from 'gsap'
import { ScrollTrigger } from 'gsap/ScrollTrigger'

import { WhatsAppIcon } from './whatsapp-icon'

gsap.registerPlugin(useGSAP, ScrollTrigger)

type Feature = {
  id: string
  eyebrow: string
  title: string
  body: string
  cta: string
  phoneSide: 'left' | 'right'
  panelClassName: string
  titleClassName: string
  bodyClassName: string
  eyebrowClassName: string
  buttonClassName: string
  accentClassName: string
  stickyTopClassName: string
}

const phoneImage = {
  src: '/mobilechat1.png',
  alt: 'Zaa ai WhatsApp chat on a phone',
  width: 361,
  height: 692,
}

const features: Feature[] = [
  {
    id: 'onboard',
    eyebrow: '01 / Onboard',
    title: 'Onboard and get your Zaa Score.',
    body: 'Get your Zaa Score and a worker virtual account inside WhatsApp in 5 minutes.',
    cta: 'Try Zaa ai',
    phoneSide: 'left',
    panelClassName: 'bg-[#1769ff] text-white',
    titleClassName: 'text-white',
    bodyClassName: 'text-[#eaf2ff]',
    eyebrowClassName: 'text-[#bfdbfe]',
    buttonClassName: 'bg-white text-[#07111f] hover:bg-[#eaf2ff]',
    accentClassName: 'bg-[#caff9a]',
    stickyTopClassName: 'lg:top-24',
  },
  {
    id: 'jobs',
    eyebrow: '02 / Jobs',
    title: 'Get matched to jobs. Instantly.',
    body: 'Employers post jobs in plain WhatsApp messages. Zaa parses them, ranks every eligible worker by score, distance, and availability, and returns the top 3 within seconds. Your score does the talking.',
    cta: 'Find opportunities',
    phoneSide: 'right',
    panelClassName: 'bg-[#d8ffc3] text-[#07111f]',
    titleClassName: 'text-[#07111f]',
    bodyClassName: 'text-[#273244]',
    eyebrowClassName: 'text-[#1769ff]',
    buttonClassName: 'bg-[#1769ff] text-white hover:bg-[#0f56d9]',
    accentClassName: 'bg-[#1769ff]',
    stickyTopClassName: 'lg:top-28',
  },
  {
    id: 'payments',
    eyebrow: '03 / Payments',
    title: 'Get paid safely. Save automatically.',
    body: "Employers pay into Squad escrow. You do the job. Send a photo. Zaa's AI verifies completion and releases your payment: 90% to your wallet, 10% auto-saved. Every job builds your financial history.",
    cta: 'Start safely',
    phoneSide: 'left',
    panelClassName: 'bg-[#07111f] text-white',
    titleClassName: 'text-white',
    bodyClassName: 'text-[#dbeafe]',
    eyebrowClassName: 'text-[#93c5fd]',
    buttonClassName: 'bg-white text-[#07111f] hover:bg-[#dbeafe]',
    accentClassName: 'bg-[#1769ff]',
    stickyTopClassName: 'lg:top-32',
  },
  {
    id: 'financial-services',
    eyebrow: '04 / Financial access',
    title: 'Turn work signals into financial access.',
    body: 'Zaa connects traders and workers to credit, savings, insurance, and payments using alternative data and behavioural signals rather than traditional credit history.',
    cta: 'Build your profile',
    phoneSide: 'right',
    panelClassName: 'bg-[#eef5ff] text-[#07111f]',
    titleClassName: 'text-[#07111f]',
    bodyClassName: 'text-[#475569]',
    eyebrowClassName: 'text-[#175cd3]',
    buttonClassName: 'bg-[#1d2230] text-white hover:bg-[#1769ff]',
    accentClassName: 'bg-[#caff9a]',
    stickyTopClassName: 'lg:top-36',
  },
]

export function FeatureSections({ whatsappChatUrl }: { whatsappChatUrl: string }) {
  const sectionRef = useRef<HTMLElement>(null)

  useGSAP(
    () => {
      if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
        return
      }

      const cards = gsap.utils.toArray<HTMLElement>('[data-feature-card]')

      cards.forEach((card) => {
        const phone = card.querySelector<HTMLElement>('[data-feature-phone]')
        const copy = card.querySelectorAll<HTMLElement>('[data-feature-copy]')
        const accent = card.querySelector<HTMLElement>('[data-feature-accent]')
        const surface = card.querySelector<HTMLElement>('[data-feature-surface]')
        const side = card.dataset.phoneSide === 'left' ? -1 : 1

        if (surface) {
          gsap.from(surface, {
            y: 36,
            opacity: 0,
            duration: 0.42,
            ease: 'power2.out',
            scrollTrigger: {
              trigger: card,
              start: 'top 86%',
              toggleActions: 'play none none reverse',
            },
          })
        }

        if (phone) {
          gsap.from(phone, {
            x: side * 34,
            y: 18,
            rotate: side * 1.8,
            opacity: 0,
            duration: 0.46,
            ease: 'power2.out',
            scrollTrigger: {
              trigger: card,
              start: 'top 76%',
              toggleActions: 'play none none reverse',
            },
          })

          gsap.to(phone, {
            y: -18,
            ease: 'none',
            scrollTrigger: {
              trigger: card,
              start: 'top bottom',
              end: 'bottom top',
              scrub: 0.4,
            },
          })
        }

        if (copy.length > 0) {
          gsap.from(copy, {
            y: 18,
            opacity: 0,
            duration: 0.36,
            ease: 'power2.out',
            stagger: 0.06,
            scrollTrigger: {
              trigger: card,
              start: 'top 76%',
              toggleActions: 'play none none reverse',
            },
          })
        }

        if (accent) {
          gsap.fromTo(
            accent,
            { scaleX: 0, transformOrigin: card.dataset.phoneSide === 'left' ? 'right center' : 'left center' },
            {
              scaleX: 1,
              duration: 0.42,
              ease: 'power2.out',
              scrollTrigger: {
                trigger: card,
                start: 'top 72%',
                toggleActions: 'play none none reverse',
              },
            },
          )
        }
      })
    },
    { scope: sectionRef },
  )

  return (
    <section ref={sectionRef} id="features" className="bg-white px-5 pb-8 pt-14 sm:px-8 sm:pt-20 lg:pb-12 lg:pt-28">
      <div className="mx-auto max-w-7xl">
        <div className="mb-8 max-w-3xl sm:mb-12 lg:mb-28">
          <p className="text-sm font-medium uppercase tracking-[0.16em] text-[#175cd3]">How Zaa works</p>
          <h2 className="mt-4 text-2xl font-semibold leading-tight text-[#07111f] sm:text-4xl">
            Built around WhatsApp, work, and the financial identity people already earn every day.
          </h2>
        </div>

        <div className="space-y-6 sm:space-y-8 lg:space-y-0 lg:pb-16">
          {features.map((feature, index) => (
            <FeatureCard key={feature.id} feature={feature} index={index} whatsappChatUrl={whatsappChatUrl} />
          ))}
        </div>
      </div>
    </section>
  )
}

function FeatureCard({
  feature,
  index,
  whatsappChatUrl,
}: {
  feature: Feature
  index: number
  whatsappChatUrl: string
}) {
  const phone = (
    <div
      data-feature-phone
      className={`relative z-20 mx-auto flex w-full max-w-[13.5rem] justify-center sm:max-w-[15.5rem] lg:absolute lg:-top-24 lg:max-w-[20rem] xl:-top-28 xl:max-w-[21.5rem] ${
        feature.phoneSide === 'left' ? 'lg:left-[7%]' : 'lg:right-[7%]'
      }`}
    >
      <div className="absolute inset-x-8 top-16 bottom-8 rounded-full bg-black/20 blur-3xl" aria-hidden="true" />
      <img
        src={phoneImage.src}
        alt={phoneImage.alt}
        width={phoneImage.width}
        height={phoneImage.height}
        className="relative z-10 h-auto w-full drop-shadow-[0_28px_38px_rgba(15,23,42,0.22)]"
      />
    </div>
  )

  const copy = (
    <div className={`relative z-10 max-w-2xl ${feature.phoneSide === 'left' ? 'lg:ml-[43%]' : 'lg:mr-[43%]'}`}>
      <p data-feature-copy className={`text-sm font-semibold uppercase tracking-[0.16em] ${feature.eyebrowClassName}`}>
        {feature.eyebrow}
      </p>
      <h3 data-feature-copy className={`mt-5 text-2xl font-semibold leading-tight sm:text-4xl lg:text-5xl ${feature.titleClassName}`}>
        {feature.title}
      </h3>
      <p data-feature-copy className={`mt-5 text-base leading-7 sm:mt-6 sm:leading-8 sm:text-lg ${feature.bodyClassName}`}>
        {feature.body}
      </p>
      <a
        data-feature-copy
        href={whatsappChatUrl}
        target="_blank"
        rel="noopener noreferrer"
        className={`mt-7 inline-flex min-h-12 w-full items-center justify-center gap-2 rounded-lg px-6 text-base font-medium transition-colors duration-150 ease-out motion-safe:transition-transform motion-safe:hover:-translate-y-0.5 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#1769ff] focus-visible:ring-offset-4 sm:w-fit ${feature.buttonClassName}`}
      >
        <WhatsAppIcon className="size-4" />
        {feature.cta}
      </a>
    </div>
  )

  return (
    <article
      data-feature-card
      data-phone-side={feature.phoneSide}
      className={`relative lg:sticky lg:mb-24 last:lg:mb-0 xl:mb-28 ${feature.stickyTopClassName}`}
      style={{ zIndex: index + 1 }}
    >
      <div
        data-feature-surface
        className={`relative rounded-[1.5rem] px-5 py-8 shadow-sm sm:rounded-[2rem] sm:px-10 sm:py-10 lg:px-16 lg:py-20 ${feature.panelClassName}`}
      >
        <div data-feature-accent className={`absolute inset-x-8 top-0 h-1 rounded-full ${feature.accentClassName}`} />
        <div className="grid gap-8 lg:block">
          {phone}
          {copy}
        </div>
      </div>
    </article>
  )
}
