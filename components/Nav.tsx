import Link from 'next/link';

export function Nav() {
  return (
    <nav className="border-b border-border">
      <div className="mx-auto flex max-w-6xl items-center gap-6 p-4">
        <Link href="/" className="font-bold text-lg">KickTrack</Link>
        <Link href="/" className="text-sm hover:underline">Dashboard</Link>
        <Link href="/add" className="text-sm hover:underline">Add</Link>
        <Link href="/catalog" className="text-sm hover:underline">Catalog</Link>
        <Link href="/settings" className="ml-auto text-sm hover:underline">Settings</Link>
      </div>
    </nav>
  );
}
