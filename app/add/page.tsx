import { brainrots } from '@/shared/data/brainrots';
import { mutations } from '@/shared/data/mutations';
import { AddBrainrotForm } from '@/components/brainrot/AddBrainrotForm';

export default function AddPage() {
  return (
    <div>
      <h1 className="mb-6 text-2xl font-bold">Add brainrot</h1>
      <AddBrainrotForm brainrots={brainrots} mutations={mutations} />
    </div>
  );
}
