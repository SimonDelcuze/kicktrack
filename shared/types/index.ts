export type Rarity = {
  id: number;
  name: string;
  tier_order: number;
  color_hex: string;
};

export type Mutation = {
  id: number;
  name: string;
  multiplier: number;
  color_hex: string;
  tier_order: number;
};

export type Brainrot = {
  id: number;
  name: string;
  rarity_id: number;
  base_money_per_sec: number;
  level_growth_factor: number;
  image_url?: string;
};

export type UserBrainrot = {
  id: string;
  brainrot_id: number;
  mutation_id: number | null;
  level: number;
  nickname?: string;
  created_at: string;
  updated_at: string;
};
