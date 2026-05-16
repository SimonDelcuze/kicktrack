# Trade section — design

Date : 2026-05-16
Auteur : Simon

## Contexte

KickTrack a actuellement une seule section "Base" (≤30 brainrots, optimisée pour le revenu/sec). On ajoute une section "Trade" : un stash sans limite pour les brainrots détenus mais pas en base de production, avec ajout/retrait en bulk via compteurs, et un journal des transactions persisté.

## Scope

- Switcher Base / Trade sur la même page (`/`).
- Section Trade : storage `UserBrainrot[]` séparé, pas de cap, level=1 implicite.
- Cartes Trade groupées par `(brainrot_id, mutation_id)` avec `[− N +]` inline.
- Refonte du dialog d'ajout existant : footer `[− N +]` au lieu du bouton "Add". Marche pour Base ET Trade.
- Journal de transactions persisté, affiché en chat-style au bottom du tab Trade, mergé visuellement par fenêtres de 5min.
- Undo/redo Trade indépendant de l'undo Base.

## Hors scope (V1)

- Édition de level/nickname sur les entrées Trade (level fixé à 1, pas de clic-pour-éditer sur les cartes groupées).
- Backfill du log à partir des entrées existantes (le log démarre vide).
- Keyboard shortcuts pour l'undo Trade (Ctrl+Z reste dédié à la Base pour éviter la confusion).
- Pagination du log (V1 affiche tout, on verra si ça déborde).

## Modèle de données

### Storage KV

| Clé                       | Type                       | Description                                              |
|---------------------------|----------------------------|----------------------------------------------------------|
| `kicktrack:base`          | `UserBrainrot[]`           | Existant, inchangé. Cap 30.                              |
| `kicktrack:trade`         | `UserBrainrot[]`           | Nouveau. Pas de cap. Toutes entrées `level === 1`.       |
| `kicktrack:trade:log`     | `TradeLogEvent[]`          | Nouveau. Journal append-only des ops Trade.              |

### Types

```ts
// shared/types.ts (étendre)
export type TradeLogEvent = {
  id: string;             // uuid
  ts: string;             // ISO timestamp
  op: '+' | '-';          // sens
  brainrot_id: number;
  mutation_id: number | null;
};
```

`UserBrainrot` est inchangé. Les entrées Trade utilisent toujours `level: 1`.

## Architecture serveur

### `server/services/trade.ts` (nouveau)

Mirror de `base.ts` sans l'éviction. Toutes les ops mutatives appendent au log (sauf `replaceTrade` qui est utilisé par undo/redo et doit pouvoir bypass).

```ts
export async function getTrade(): Promise<UserBrainrot[]>;
export async function addToTrade(brainrot_id: number, mutation_id: number | null):
  Promise<{ entry: UserBrainrot; event: TradeLogEvent }>;
export async function removeOneByComboFromTrade(brainrot_id: number, mutation_id: number | null):
  Promise<{ removedId: string; event: TradeLogEvent } | null>; // null si aucune entrée matching
export async function replaceTrade(entries: UserBrainrot[]): Promise<void>;
```

### `server/services/trade-log.ts` (nouveau)

```ts
export async function getTradeLog(): Promise<TradeLogEvent[]>;
export async function appendTradeLogEvent(event: TradeLogEvent): Promise<void>;
export async function removeTradeLogEventById(id: string): Promise<void>;
export async function replaceTradeLog(events: TradeLogEvent[]): Promise<void>;
```

### Extension de `server/services/base.ts`

```ts
export async function removeOneByComboFromBase(brainrot_id: number, mutation_id: number | null, level: number):
  Promise<{ removedId: string } | null>;
```

Utilisé par le `−` du dialog d'ajout côté Base. Trouve l'entrée la plus récente matching le combo et la supprime.

### Server actions

| Action                              | Localisation               | Description                                             |
|-------------------------------------|----------------------------|---------------------------------------------------------|
| `addToTradeAction`                  | `app/trade/actions.ts`     | Add 1 + append log. Retourne `previousTrade`/`previousLog` pour undo session-side. |
| `removeOneFromTradeAction`          | `app/trade/actions.ts`     | Pop 1 du combo + append log. Idem.                      |
| `setTradeAction`                    | `app/trade/actions.ts`     | Bulk replace (utilisé par undo/redo).                   |
| `setTradeLogAction`                 | `app/trade/actions.ts`     | Replace log (utilisé par undo/redo en complément).      |
| `removeOneFromBaseAction`           | `app/add/actions.ts` (étendre) | Pour le `−` du dialog en tab Base.                  |

Toutes les actions appellent `revalidatePath('/')`.

## UI

### `app/page.tsx`

Charge `base`, `trade`, `tradeLog` en parallèle et les passe à `DashboardClient`.

### `components/DashboardClient.tsx`

Devient le shell du switcher. Deux tabs : "Base" (existant, isolé dans `BaseSection`) et "Trade" (nouveau, `TradeSection`). State local `section: 'base' | 'trade'`.

Le switcher est rendu au-dessus des sections, simple : deux boutons avec underline / fond actif (style cohérent avec le reste, pas besoin de shadcn Tabs).

### `components/sections/BaseSection.tsx` (extrait du DashboardClient actuel)

Comporte le `StatsHeader` actuel + le bouton Add + la grille de cartes Base + l'`EditBrainrotDialog`. Reçoit le `base`, `brainrots`, `mutations`. C'est essentiellement le `DashboardClient` actuel renommé/déplacé.

L'`AddBrainrotDialog` est rendu avec `section="base"`.

### `components/sections/TradeSection.tsx` (nouveau)

- `TradeStatsHeader` : total max-lvl-75 income (somme de `maxLevelIncome(brainrot, mutation)` sur toutes les entrées) + count total. Pas d'income/sec courant.
- Bouton "+ Add" qui ouvre l'`AddBrainrotDialog` avec `section="trade"`.
- Toolbar avec flèches ← / → pour undo / redo trade (disabled selon le state du `TradeHistoryProvider`).
- Grille de `TradeCard` groupées par `(brainrot_id, mutation_id)`.
- `TradeHistoryLog` au bottom de la section.

### `components/brainrot/TradeCard.tsx` (nouveau)

Inspiré de `BrainrotCard` mais contenu différent :

```
┌─────────────────────────────────┐
│  Beluga Beluga          [×3]    │   ← nom + badge count en haut à droite
│  ┌──────┐                       │
│  │ GOLD │  ×1.5                 │   ← chip mutation (réutilise MutationChip)
│  └──────┘                       │
│                                 │
│  Base   862.5K                  │   ← base × mutation (lvl 1)
│  Max    74.6Sp                  │   ← maxLevelIncome (lvl 75 × mutation)
│                                 │
│  [  −   3   +  ]                │   ← contrôle inline
└─────────────────────────────────┘
```

- Pas de level affiché.
- Les deux chiffres formatés via `formatNumber`, sans suffixe `/s`.
- `+` : appelle `addToTradeAction(brainrot_id, mutation_id)`. Update optimiste.
- `−` : appelle `removeOneFromTradeAction(...)`. Disabled à N=0 (mais N=0 → la carte n'existe pas, donc en pratique disabled jamais affiché).
- Pas de clic sur le body (pas d'edit en V1).

### `components/dialogs/AddBrainrotDialog.tsx` (refonte)

Nouveau prop : `section: 'base' | 'trade'`, `currentEntries: UserBrainrot[]` (la base ou la trade selon la section).

L'`AddBrainrotForm` ajuste son footer :
- Quand un brainrot est sélectionné (mutation optionnelle), au lieu du bouton "Add" actuel, affiche `[ − N + ]` où :
  - `N` = nombre d'entrées dans `currentEntries` matching `brainrot_id` + `mutation_id` (level=1).
  - `+` : appelle l'add action correspondant à `section`. Pour Base, gère l'éviction comme aujourd'hui (toast si full + trop faible).
  - `−` : appelle l'action remove-by-combo correspondante. Disabled si N=0.
- Le dialog reste ouvert (comportement actuel inchangé).
- Le brainrot/mutation reste sélectionné après une op pour permettre les enchaînements.

### `components/trade/TradeHistoryLog.tsx` (nouveau)

- Layout chat : message bubbles, newest en bas, scrollable.
- Chaque bubble correspond à un événement ou groupe d'événements mergés.
- **Merge rule** : événements consécutifs (dans l'ordre du log) avec même `(op, brainrot_id, mutation_id)` ET dont les `ts` sont tous dans une fenêtre de 5min (depuis le premier event du groupe) → un seul bubble `+N` ou `−N`.
- Couleurs : `+` vert (`text-green-400` ou similaire), `−` rouge (`text-red-400`).
- Format bubble : `+3 Beluga Beluga gold` (ou `−1 Tralaledon` si pas de mutation).
- Timestamp léger sous chaque bubble : horaire local (ex : "14:23").
- Empty state si le log est vide.

### `components/trade/TradeHistoryProvider.tsx` (nouveau)

Mirror simplifié de `HistoryProvider` :
- Session-only (`useState` à la racine du tab Trade).
- Snapshot = `{ trade: UserBrainrot[], log: TradeLogEvent[] }`.
- `recordMutation(prev)` avant chaque action mutative.
- `undo()` : pop le dernier snapshot, l'envoie via `setTradeAction` + `setTradeLogAction`, push dans `future`.
- `redo()` : symétrique.
- **Pas de hook keyboard** pour ne pas entrer en conflit avec le Ctrl+Z de la base. Les flèches ← → dans la toolbar Trade sont le seul accès.

## Flux principaux

### Ajouter via le dialog (tab Trade)

1. User ouvre le dialog (bouton "+ Add" du tab Trade).
2. Sélectionne un brainrot + une mutation.
3. Footer affiche `[ − 0 + ]`.
4. Clic `+` → `addToTradeAction(brainrot_id, mutation_id)` :
   - Server : append entrée à `kicktrack:trade`, append event à `kicktrack:trade:log`.
   - Retourne `{ previousTrade, previousLog }`.
   - Client : `TradeHistoryProvider.recordMutation({ trade: previousTrade, log: previousLog })`.
5. Le footer affiche `[ − 1 + ]` après revalidation.
6. User peut chainer.

### Retirer via une carte Trade

1. Clic `−` sur une carte.
2. `removeOneFromTradeAction(brainrot_id, mutation_id)` :
   - Server : retire l'entrée la plus récente matching, append event `−` au log.
   - Retourne `{ previousTrade, previousLog }`.
3. Client : record mutation, optimistic update.

### Undo trade

1. User clique la flèche ← du tab Trade.
2. `TradeHistoryProvider.undo()` :
   - Pop le snapshot précédent (qui contient `{ trade, log }` AVANT la dernière mutation).
   - Le log restauré ne contient PAS l'event qu'on undo → effet "clean trace".
   - Appelle `setTradeAction` + `setTradeLogAction` pour persister.
   - Push l'état courant dans `future` pour permettre le redo.

## Calculs

Aucune nouvelle fonction de calcul. On réutilise :
- `currentMoneyPerSec(brainrot, 1, mutation)` pour le "Base × mutation" de la carte.
- `maxLevelIncome(brainrot, mutation)` pour le "Max lvl 75".
- `formatNumber` pour le rendu.

## Tests

- `server/services/trade.test.ts` : `addToTrade`, `removeOneByComboFromTrade` (cas combo absent), `replaceTrade`.
- `server/services/trade-log.test.ts` : append, remove-by-id, replace.
- `shared/utils/trade-merge.test.ts` : algorithme de merge 5min des events pour le log (fonction pure, testable indépendamment du UI).
- Tests existants (`base.test.ts` et co) restent verts.

## Migration

Pas de migration : les nouvelles clés KV démarrent vides. La clé `kicktrack:base` est inchangée.

## Décisions clés (récap)

| Décision                              | Choix                                                       |
|---------------------------------------|-------------------------------------------------------------|
| Cap Trade                             | Pas de limite                                               |
| Level dans Trade                      | Toujours 1 en DB, jamais affiché                            |
| Grouping cartes Trade                 | `(brainrot_id, mutation_id)` avec badge `×N`                |
| Counter dans dialog                   | `[ − N + ]`, 1 clic = 1 op, instant, pas de submit          |
| Easy remove Trade                     | `±` inline sur la carte (pas de mode select multi)          |
| Trade stats                           | Total max-lvl-75 income + count                             |
| Trade base income card                | Base × mutation (lvl 1 avec mutation)                       |
| Undo/redo Trade                       | Indépendant de la Base, session-only, flèches ← →           |
| Keyboard shortcut undo Trade          | Non (Ctrl+Z reste Base)                                     |
| Undo Trade et log                     | Retire l'event correspondant du log (clean trace)           |
| Persistance log                       | KV `kicktrack:trade:log`, append-only, merging au render    |
| Granularité merge log                 | 5min depuis le 1er event du groupe, même combo, même sens   |
| Position du chat dans la page         | Bottom du tab Trade uniquement                              |
