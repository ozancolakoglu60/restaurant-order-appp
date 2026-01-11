import { createBrowserClient } from '@supabase/ssr'
import type { Database } from './database.types'

// Client-side için Supabase client
// Cookie yönetimi için document.cookie kullanır
let clientInstance: ReturnType<typeof createBrowserClient<Database>> | null = null

export function createClient() {
  if (typeof window === 'undefined') {
    throw new Error('createClient can only be called in browser environment')
  }

  if (!clientInstance) {
    clientInstance = createBrowserClient<Database>(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      {
        cookies: {
          getAll() {
            if (typeof document === 'undefined') return []
            return document.cookie.split('; ').map(cookie => {
              const [name, ...rest] = cookie.split('=')
              return { 
                name: name.trim(), 
                value: decodeURIComponent(rest.join('=') || '') 
              }
            }).filter(c => c.name)
          },
          setAll(cookiesToSet: Array<{ name: string; value: string; options?: any }>) {
            if (typeof document === 'undefined') return
            cookiesToSet.forEach(({ name, value, options }) => {
              let cookieString = `${name}=${encodeURIComponent(value)}; path=/`
              
              if (options?.maxAge) {
                cookieString += `; max-age=${options.maxAge}`
              }
              
              if (options?.expires) {
                cookieString += `; expires=${options.expires}`
              }
              
              if (options?.sameSite) {
                cookieString += `; samesite=${options.sameSite}`
              }
              
              if (options?.secure) {
                cookieString += '; secure'
              }
              
              // httpOnly client-side'da ayarlanamaz, sadece server-side
              
              console.log('🍪 Cookie ayarlanıyor:', name, value.substring(0, 20) + '...')
              document.cookie = cookieString
            })
          }
        }
      }
    )
  }

  return clientInstance
}
