const footerLinks = [
  {
    label: 'Terms',
    href: '#terms',
  },
  {
    label: 'Privacy Policy',
    href: '#privacy',
  },
  {
    label: 'Twitter',
    href: '#twitter',
  },
  {
    label: 'Facebook',
    href: '#facebook',
  },
]

export function FooterSection() {
  return (
    <footer className="relative overflow-hidden bg-[#f8f9fb] px-5 pb-0 pt-16 sm:px-8 lg:pt-24">
      <div className="mx-auto max-w-7xl">
        <div className="flex flex-col gap-8 sm:flex-row sm:items-start sm:justify-between">
          <nav aria-label="Footer navigation" className="flex flex-wrap items-center gap-x-10 gap-y-4">
            {footerLinks.map((link) => (
              <a
                key={link.label}
                href={link.href}
                className="text-base font-medium text-[#111827] transition-colors duration-150 ease-out hover:text-[#1769ff] focus-visible:rounded-md focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#1769ff] focus-visible:ring-offset-4 sm:text-lg"
              >
                {link.label}
              </a>
            ))}
          </nav>

          <p className="text-base font-semibold text-[#8b94a3] sm:text-lg">&copy; 2026 copyright all rights reserved.</p>
        </div>

        <div className="mt-24 flex h-[14rem] items-end overflow-hidden sm:h-[17rem] lg:mt-28 lg:h-[20rem]">
          <div className="flex min-w-full items-end justify-center gap-[3vw]">
            <div className="mb-1 flex items-end gap-[1.4vw]" aria-hidden="true">
              <span className="block h-[clamp(7rem,17vw,16rem)] w-[clamp(2rem,4vw,4.4rem)] skew-x-[-8deg] rounded-t-lg bg-[#0f51ff]" />
              <span className="block h-[clamp(7rem,17vw,16rem)] w-[clamp(2rem,4vw,4.4rem)] skew-x-[-8deg] rounded-t-lg bg-[#0f51ff]" />
            </div>
            <span className="select-none text-[clamp(9rem,26vw,24rem)] font-extrabold leading-[0.65] tracking-[-0.08em] text-[#a8aaad]">
              zaa
            </span>
          </div>
        </div>
      </div>
    </footer>
  )
}
