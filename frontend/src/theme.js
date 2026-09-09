/**
 * RFH HMS visual theme — strict brand palette.
 * #ffffff white · #f5f5f5 canvas · #f8f8f8 panels · #e41e1f accent · #8b8b8b muted
 */
export const theme = {
  white: '#ffffff',
  canvas: '#f5f5f5',
  panel: '#f8f8f8',
  accent: '#e41e1f',
  muted: '#8b8b8b',
  /** Near-black for readable body/headings (not a decorative colour) */
  ink: '#1f1f1f',
  border: 'rgba(139, 139, 139, 0.28)',
};

export const portalChrome = {
  page: 'flex min-h-screen bg-[#f5f5f5]',
  aside:
    'fixed left-0 top-0 z-20 flex h-screen w-72 flex-col border-r border-[#8b8b8b]/30 bg-[#ffffff] text-[#1f1f1f] shadow-sm',
  asideStatic:
    'flex w-72 shrink-0 flex-col border-r border-[#8b8b8b]/30 bg-[#ffffff] text-[#1f1f1f] shadow-sm',
  brandBlock: 'border-b border-[#8b8b8b]/25 bg-[#f8f8f8] p-6',
  brandTitle: 'text-xl font-bold leading-tight text-[#1f1f1f]',
  brandPortal: 'text-xs font-medium text-[#e41e1f]',
  brandHospital: 'mt-2 text-sm text-[#8b8b8b]',
  brandEmail: 'mt-3 truncate text-xs text-[#8b8b8b]',
  nav: 'flex-1 space-y-1 overflow-y-auto px-2 py-4',
  navActive: 'bg-[#e41e1f] text-[#ffffff]',
  navIdle: 'text-[#1f1f1f] hover:bg-[#f8f8f8]',
  navItem: (isActive) =>
    `flex items-center gap-3 rounded-lg px-4 py-3 text-sm font-medium transition ${
      isActive ? 'bg-[#e41e1f] text-[#ffffff]' : 'text-[#1f1f1f] hover:bg-[#f8f8f8]'
    }`,
  footer: 'space-y-1 border-t border-[#8b8b8b]/25 bg-[#f8f8f8] p-2 pb-4',
  footerLink:
    'flex w-full items-center gap-3 rounded-lg px-4 py-3 text-sm font-medium text-[#1f1f1f] hover:bg-[#f5f5f5]',
  logout:
    'flex w-full items-center gap-3 rounded-lg px-4 py-3 text-left text-sm font-medium text-[#e41e1f] hover:bg-[#f5f5f5]',
  eyebrow: 'text-xs font-semibold uppercase tracking-[0.2em] text-[#8b8b8b]',
  card: 'rounded-2xl border border-[#8b8b8b]/25 bg-[#ffffff] shadow-sm',
  btnPrimary:
    'inline-flex items-center justify-center gap-2 rounded-lg bg-[#e41e1f] px-4 py-2.5 text-sm font-semibold text-[#ffffff] transition hover:opacity-90',
  btnSecondary:
    'inline-flex items-center justify-center gap-2 rounded-lg border border-[#8b8b8b]/40 bg-[#ffffff] px-4 py-2.5 text-sm font-semibold text-[#1f1f1f] transition hover:bg-[#f8f8f8]',
};
