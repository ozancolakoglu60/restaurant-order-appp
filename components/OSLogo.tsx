'use client'

import { useMemo, useState } from 'react'

export default function OSLogo({ size = 'default', showText = true }: { size?: 'small' | 'default' | 'large', showText?: boolean }) {
  // IMPORTANT:
  // For a pixel-perfect match with the provided logo, we render the exact image from /public.
  // Place the file at ONE of:
  // - public/os-yazilim-logo.jpg
  // - public/os-yazilim-logo.png
  // - public/os-yazilim-logo.webp
  const fullLogoSizeClasses = {
    small: 'w-28 h-28', // compact for headers
    default: 'w-44 h-44',
    large: 'w-56 h-56',
  }

  const iconOnlySizeClasses = {
    small: 'w-10 h-10',
    default: 'w-14 h-14',
    large: 'w-20 h-20',
  }

  const containerClass =
    (showText ? fullLogoSizeClasses[size] : iconOnlySizeClasses[size]) ||
    (showText ? fullLogoSizeClasses.default : iconOnlySizeClasses.default)

  const candidates = useMemo(() => {
    // Try common formats so user can drop the file with any of these extensions.
    return ['/os-yazilim-logo.svg', '/os-yazilim-logo.png', '/os-yazilim-logo.jpg', '/os-yazilim-logo.webp']
  }, [])

  const [srcIdx, setSrcIdx] = useState(0)
  const [missing, setMissing] = useState(false)
  const src = candidates[srcIdx] || candidates[0]

  return (
    <div className="flex items-center justify-center">
      <div
        className={`relative ${containerClass} overflow-hidden`}
        aria-label="OS Yazılım"
        title="OS Yazılım"
      >
        {/* 
          If showText=false, we crop the lower part (where the text is) by using a shorter box
          and object-fit cover with top alignment.
        */}
        <img
          src={src}
          alt="OS Yazılım"
          className="w-full h-full select-none"
          draggable={false}
          onError={() => {
            // If file name/extension is different, try next candidate.
            if (srcIdx < candidates.length - 1) setSrcIdx((i) => i + 1)
            else setMissing(true)
          }}
          style={{
            objectFit: showText ? 'contain' : 'cover',
            objectPosition: showText ? 'center' : 'center top',
            // On small icon, crop out the bottom "OS YAZILIM" line.
            transform: showText ? undefined : 'scale(1.6)',
          }}
        />

        {/* Minimal fallback if no logo file exists in /public */}
        {missing && (
          <div className="absolute inset-0 flex items-center justify-center bg-white/80">
            <div className="text-center">
              <div className="text-xs text-gray-700 font-semibold">Logo bulunamadı</div>
              <div className="text-[10px] text-gray-500 mt-1">
                `public/os-yazilim-logo.(jpg|png|webp)`
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
