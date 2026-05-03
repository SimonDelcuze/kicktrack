'use client';

import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import type { Brainrot, Mutation } from '@/shared/types';
import { createBrainrotAction } from '@/app/add/actions';

type Props = {
  brainrots: readonly Brainrot[];
  mutations: readonly Mutation[];
};

export function AddBrainrotForm({ brainrots, mutations }: Props) {
  return (
    <form action={createBrainrotAction} className="grid gap-4 max-w-md">
      <div>
        <Label htmlFor="brainrot_id">Brainrot</Label>
        <Select name="brainrot_id" required>
          <SelectTrigger><SelectValue placeholder="Pick one" /></SelectTrigger>
          <SelectContent>
            {brainrots.map((b) => (
              <SelectItem key={b.id} value={String(b.id)}>{b.name}</SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <div>
        <Label htmlFor="mutation_id">Mutation (optional)</Label>
        <Select name="mutation_id" defaultValue="null">
          <SelectTrigger><SelectValue /></SelectTrigger>
          <SelectContent>
            <SelectItem value="null">None</SelectItem>
            {mutations.map((m) => (
              <SelectItem key={m.id} value={String(m.id)}>
                {m.name} ×{m.multiplier}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <div>
        <Label htmlFor="level">Level (1–75)</Label>
        <Input id="level" name="level" type="number" min={1} max={75} defaultValue={1} required />
      </div>

      <div>
        <Label htmlFor="nickname">Nickname (optional)</Label>
        <Input id="nickname" name="nickname" type="text" maxLength={50} />
      </div>

      <Button type="submit">Add to base</Button>
    </form>
  );
}
