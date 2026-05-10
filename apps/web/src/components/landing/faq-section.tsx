import { useRef, useState } from 'react'

import { useGSAP } from '@gsap/react'
import gsap from 'gsap'
import { ScrollTrigger } from 'gsap/ScrollTrigger'
import { Minus, Plus } from 'lucide-react'

gsap.registerPlugin(useGSAP, ScrollTrigger)

const faqs = [
  {
    question: 'What is Zaa ai?',
    answer:
      'Zaa ai is a conversational AI layer that helps workers, traders, artisans, and job seekers access opportunities, financial services, and simple work tools through WhatsApp.',
  },
  {
    question: 'Who is Zaa built for?',
    answer:
      'It is built for people in the informal economy: market traders, service workers, artisans, delivery workers, apprentices, and young people looking for work or income opportunities.',
  },
  {
    question: 'What is a Zaa Score?',
    answer:
      'Your Zaa Score is a living profile built from verified work activity, reliability, completed jobs, savings behavior, and other alternative signals. It helps you stand out without needing traditional credit history.',
  },
  {
    question: 'Do users need to download another app?',
    answer:
      'No. Zaa starts inside WhatsApp. Users can onboard, answer questions, receive matches, build a profile, and access services through a familiar chat experience.',
  },
  {
    question: 'How does job matching work?',
    answer:
      'Employers can post jobs in plain WhatsApp messages. Zaa reads the request, checks eligible workers by score, distance, and availability, then returns the best matches quickly.',
  },
  {
    question: 'How do safe payments work?',
    answer:
      'For supported jobs, payments can move through escrow. The worker completes the job, submits proof, and Zaa helps verify completion before funds are released.',
  },
  {
    question: 'How does Zaa connect people to financial services?',
    answer:
      'Zaa uses alternative data and behavioural signals from real work activity to help workers and traders access credit, savings, insurance, and payments.',
  },
]

export function FaqSection() {
  const sectionRef = useRef<HTMLElement>(null)
  const [openQuestion, setOpenQuestion] = useState(faqs[0].question)

  useGSAP(
    () => {
      if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
        return
      }

      gsap.from('[data-faq-reveal]', {
        y: 28,
        opacity: 0,
        duration: 0.42,
        ease: 'power2.out',
        stagger: 0.06,
        scrollTrigger: {
          trigger: sectionRef.current,
          start: 'top 74%',
          toggleActions: 'play none none reverse',
        },
      })
    },
    { scope: sectionRef },
  )

  return (
    <section ref={sectionRef} id="faq" className="bg-white px-5 py-14 sm:px-8 sm:py-20 lg:py-28">
      <div className="mx-auto max-w-5xl">
        <div data-faq-reveal className="mx-auto mb-10 text-center sm:mb-16 lg:mb-20">
          <h2 className="text-3xl font-semibold leading-tight tracking-[-0.01em] text-[#1d2230] sm:text-5xl lg:text-6xl">
            Frequently Asked Questions
          </h2>
        </div>

        <div data-faq-reveal>
          {faqs.map((faq, index) => {
            const isOpen = openQuestion === faq.question
            const itemId = `faq-${faq.question.toLowerCase().replaceAll(' ', '-')}`

            return (
              <div key={faq.question} className="border-b border-[#edf1f6] first:border-t">
                <button
                  type="button"
                  aria-expanded={isOpen}
                  aria-controls={itemId}
                  onClick={() => setOpenQuestion(isOpen ? '' : faq.question)}
                  className="flex min-h-18 w-full items-center justify-between gap-4 px-0 py-5 text-left text-base font-semibold text-black transition-colors duration-150 ease-out hover:text-[#1769ff] focus-visible:rounded-lg focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#1769ff] focus-visible:ring-offset-4 sm:min-h-24 sm:px-8 sm:py-7 sm:text-xl"
                >
                  <span>
                    {index + 1}. {faq.question}
                  </span>
                  <span className="flex size-8 shrink-0 items-center justify-center text-black sm:size-10">
                    {isOpen ? <Minus className="size-5 sm:size-6" aria-hidden="true" /> : <Plus className="size-5 sm:size-6" aria-hidden="true" />}
                  </span>
                </button>
                <div
                  id={itemId}
                  className={`grid transition-[grid-template-rows] duration-200 ease-out ${isOpen ? 'grid-rows-[1fr]' : 'grid-rows-[0fr]'}`}
                >
                  <div className="overflow-hidden">
                    <p className="max-w-3xl pb-6 text-sm leading-7 text-[#475569] sm:px-8 sm:pb-8 sm:text-lg sm:leading-8">{faq.answer}</p>
                  </div>
                </div>
              </div>
            )
          })}
        </div>
      </div>
    </section>
  )
}
