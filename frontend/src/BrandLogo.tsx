function BrandLogo() {
  return (
    <>
      <span className="brand-mark" aria-hidden="true">
        <svg viewBox="0 0 36 36" focusable="false">
          <path d="M9 4h18a3 3 0 0 1 3 3v14H6V7a3 3 0 0 1 3-3Z" fill="currentColor" />
          <path d="M10 9h5v5h-5zm11 0h5v5h-5z" fill="var(--page)" />
          <path d="M7 18h22" stroke="var(--coral)" strokeWidth="2" />
          <circle cx="11" cy="23" r="2" fill="var(--ink)" />
          <circle cx="25" cy="23" r="2" fill="var(--ink)" />
          <path d="M12 27 8 32m16-5 4 5M13 30h10" fill="none" stroke="currentColor" strokeLinecap="round" strokeWidth="2" />
        </svg>
      </span>
      <span>RailYatra</span>
    </>
  )
}

export default BrandLogo