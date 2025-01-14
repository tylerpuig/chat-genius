export function LineaerGradientLoader() {
  return (
    <div className="flex w-full items-center">
      <svg className="h-2 w-full" viewBox="0 0 100 4">
        <defs>
          <linearGradient id="gradient" x1="0%" y1="0%" x2="100%" y2="0%">
            <stop offset="0%" stopColor="#0066cc">
              <animate attributeName="offset" values="-1; 1" dur="2s" repeatCount="indefinite" />
            </stop>
            <stop offset="50%" stopColor="#00bfff">
              <animate
                attributeName="offset"
                values="-0.5; 1.5"
                dur="2s"
                repeatCount="indefinite"
              />
            </stop>
            <stop offset="100%" stopColor="#1e3a8a">
              <animate attributeName="offset" values="0; 2" dur="2s" repeatCount="indefinite" />
            </stop>
          </linearGradient>
        </defs>

        <rect x="0" y="0" width="100" height="4" fill="url(#gradient)" rx="2" ry="2" />
      </svg>
    </div>
  )
}
