import { notFound } from 'next/navigation';
import { getBase } from '@/server/services/base';
import { brainrots } from '@/shared/data/brainrots';
import { mutations } from '@/shared/data/mutations';
import { EditBrainrotForm } from '@/components/brainrot/EditBrainrotForm';

export const dynamic = 'force-dynamic';

export default async function EditPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const base = await getBase();
  const user = base.find((b) => b.id === id);
  if (!user) notFound();

  return (
    <div>
      <h1 className="mb-6 text-2xl font-bold">Edit brainrot</h1>
      <EditBrainrotForm user={user} brainrots={brainrots} mutations={mutations} />
    </div>
  );
}
