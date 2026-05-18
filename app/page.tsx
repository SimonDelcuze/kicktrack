'use client';

import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { randomSlug } from '@/shared/utils/slug';

export default function LandingPage() {
  const router = useRouter();

  function handleCreate() {
    const slug = randomSlug();
    router.push(`/u/${slug}`);
  }

  return (
    <div className="flex min-h-[calc(100vh-6rem)] items-center justify-center">
      <div className="w-full max-w-sm rounded-2xl border border-border bg-card p-10 text-center shadow-sm">
        <h1 className="text-2xl font-bold tracking-tight">KickTrack</h1>
        <p className="mt-2 text-sm text-muted-foreground">
          Personal tracker for Kick a Lucky Block bases.
        </p>
        <div className="mt-8">
          <Button className="w-full" onClick={handleCreate}>
            Create new profile
          </Button>
        </div>
      </div>
    </div>
  );
}
