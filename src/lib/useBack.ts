'use client'
import { useRouter } from 'next/navigation'
import { useCallback } from 'react'

/**
 * Retourne une fonction qui navigue vers la page précédente si elle existe,
 * sinon vers le fallback fourni.
 */
export function useBack(fallback: string) {
  const router = useRouter()
  return useCallback(() => {
    // window.history.length > 1 = l'utilisateur vient de quelque part
    if (typeof window !== 'undefined' && window.history.length > 1) {
      router.back()
    } else {
      router.push(fallback)
    }
  }, [router, fallback])
}
