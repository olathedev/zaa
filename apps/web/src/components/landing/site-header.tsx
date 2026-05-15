import { WhatsAppIcon } from './whatsapp-icon'

const navItems = ['Use Cases', 'Features', 'FAQ']

export function SiteHeader({ whatsappChatUrl }: { whatsappChatUrl: string }) {
  return (
    <header className="border-t-4 border-[#173f35] bg-white">
      <nav
        aria-label="Primary navigation"
        className="mx-auto grid min-h-20 max-w-7xl grid-cols-[1fr_auto] items-center gap-x-4 gap-y-3 px-5 py-4 sm:px-8 lg:min-h-24 lg:grid-cols-[auto_1fr_auto] lg:gap-8 lg:py-0"
      >
        <a
          href="/"
          aria-label="Zaa AI home"
          className="flex min-h-10 items-center gap-2 text-[1.45rem] font-semibold tracking-normal text-[#020617] focus-visible:rounded-md focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#1769ff] focus-visible:ring-offset-4 sm:text-[1.7rem]"
        >
          <span className="flex items-center gap-0.5" aria-hidden="true">
            <span className="h-3.5 w-1.5 skew-x-[-18deg] rounded-sm bg-[#1769ff]" />
            <span className="h-4.5 w-1.5 skew-x-[-18deg] rounded-sm bg-[#1769ff]" />
          </span>
          <span>Zaa ai.</span>
        </a>

        <div className="order-3 col-span-2 flex items-center justify-center gap-5 overflow-x-auto border-t border-[#eef2f7] pt-3 pb-1 lg:order-none lg:col-span-1 lg:justify-center lg:gap-9 lg:overflow-visible lg:border-t-0 lg:pt-0 lg:pb-0">
          {navItems.map((item) => (
            <a
              key={item}
              href={`#${item.toLowerCase().replaceAll(' ', '-')}`}
              className="min-h-10 shrink-0 content-center text-[0.95rem] font-medium text-[#0f172a] transition-colors hover:text-[#1769ff] focus-visible:rounded-md focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#1769ff] focus-visible:ring-offset-4 lg:text-base"
            >
              {item}
            </a>
          ))}
        </div>

        <a
          href={whatsappChatUrl}
          target="_blank"
          rel="noopener noreferrer"
          className="inline-flex min-h-11 w-fit items-center justify-center gap-2 rounded-lg bg-[#1d2230] px-4 text-sm font-medium text-white shadow-sm transition-colors hover:bg-[#1769ff] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#1769ff] focus-visible:ring-offset-4 lg:min-h-12 lg:px-6 lg:text-base"
        >
          <WhatsAppIcon className="size-4" />
          Try now
        </a>
      </nav>
    </header>
  )
}
