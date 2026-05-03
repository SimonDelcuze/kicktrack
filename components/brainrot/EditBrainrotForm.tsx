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
import type { Brainrot, Mutation, UserBrainrot } from '@/shared/types';
import { updateBrainrotAction, deleteBrainrotAction } from '@/app/brainrot/[id]/actions';

type Props = {
  user: UserBrainrot;
  brainrots: readonly Brainrot[];
  mutations: readonly Mutation[];
};

export function EditBrainrotForm({ user, brainrots, mutations }: Props) {
  const update = updateBrainrotAction.bind(null, user.id);
  const remove = deleteBrainrotAction.bind(null, user.id);

  return (
    <div className="grid gap-6 max-w-md">
      <form action={update} className="grid gap-4">
        <div>
          <Label htmlFor="brainrot_id">Brainrot</Label>
          <Select name="brainrot_id" defaultValue={String(user.brainrot_id)} required>
            <SelectTrigger><SelectValue /></SelectTrigger>
            <SelectContent>
              {brainrots.map((b) => (
                <SelectItem key={b.id} value={String(b.id)}>{b.name}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div>
          <Label htmlFor="mutation_id">Mutation</Label>
          <Select
            name="mutation_id"
            defaultValue={user.mutation_id == null ? 'null' : String(user.mutation_id)}
          >
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
          <Label htmlFor="level">Level</Label>
          <Input id="level" name="level" type="number" min={1} max={75} defaultValue={user.level} required />
        </div>

        <div>
          <Label htmlFor="nickname">Nickname</Label>
          <Input id="nickname" name="nickname" type="text" maxLength={50} defaultValue={user.nickname || ''} />
        </div>

        <Button type="submit">Save</Button>
      </form>

      <form action={remove}>
        <Button type="submit" variant="destructive">Delete</Button>
      </form>
    </div>
  );
}
