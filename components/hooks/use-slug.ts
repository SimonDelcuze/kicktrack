'use client';
import { usePathname } from 'next/navigation';

export function useSlug(): string | null {
  const path = usePathname();
  const m = path.match(/^\/u\/([a-z0-9]+)/);
  return m ? m[1] : null;
}
