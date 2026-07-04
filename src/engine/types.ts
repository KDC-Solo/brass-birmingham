export type Era = 'canal' | 'rail';

export type IndustryType =
  | 'cotton' // Cotton Mill
  | 'goods' // Manufacturer ("crates")
  | 'pottery'
  | 'coal' // Coal Mine
  | 'iron' // Iron Works
  | 'brewery';

export const SELLABLE_INDUSTRIES: readonly IndustryType[] = ['cotton', 'goods', 'pottery'];
export const RESOURCE_INDUSTRIES: readonly IndustryType[] = ['coal', 'iron', 'brewery'];

export interface IndustryTileSpec {
  industry: IndustryType;
  level: number;
  /** Copies of this tile on each player mat */
  count: number;
  cost: number;
  costCoal: number;
  costIron: number;
  /** Eras in which this tile may be built */
  eras: readonly Era[];
  /**
   * Beer required to sell (sellable industries only).
   * 0 = sells without beer; undefined = not sellable.
   */
  beerToSell?: number;
  /** VP when flipped at era scoring */
  vp: number;
  /** Income-track SPACES advanced when the tile flips */
  incomeBump: number;
  /** Contribution to adjacent link scoring */
  linkVP: number;
  /** false for the two "lightbulb" potteries (levels 1 and 3) */
  canDevelop: boolean;
  /** Cubes placed on build: coal/iron mines and works */
  producesCoal?: number;
  producesIron?: number;
  /** Beer barrels placed on build, by era built */
  producesBeer?: { canal: number; rail: number };
}

export type CityId =
  | 'belper'
  | 'birmingham'
  | 'burton'
  | 'cannock'
  | 'coalbrookdale'
  | 'coventry'
  | 'derby'
  | 'dudley'
  | 'kidderminster'
  | 'leek'
  | 'nuneaton'
  | 'redditch'
  | 'stafford'
  | 'stoke'
  | 'stone'
  | 'tamworth'
  | 'uttoxeter'
  | 'walsall'
  | 'wolverhampton'
  | 'worcester'
  | 'farmNorth' // unnamed farm brewery near Cannock
  | 'farmSouth'; // unnamed farm brewery on the Kidderminster–Worcester link

export type MerchantId = 'shrewsbury' | 'gloucester' | 'oxford' | 'warrington' | 'nottingham';

export type LocationId = CityId | MerchantId;

export interface CitySpec {
  id: CityId;
  name: string;
  /** Each slot lists the industries buildable there; single-icon slots must be preferred */
  slots: readonly (readonly IndustryType[])[];
  isFarmBrewery: boolean;
}

export type MerchantBonus =
  | { kind: 'vp'; amount: number }
  | { kind: 'money'; amount: number }
  | { kind: 'incomeSpaces'; amount: number }
  | { kind: 'develop'; amount: number };

export interface MerchantSpec {
  id: MerchantId;
  name: string;
  /** Merchant tile slots at this location */
  slotCount: number;
  /** Location is used only at or above this player count */
  minPlayers: number;
  /** Bonus granted when a player consumes this merchant's beer */
  bonus: MerchantBonus;
  /** Each merchant location contributes 2 VP to adjacent link scoring */
  linkVP: 2;
}

export interface LinkSpec {
  id: string;
  /** 2 endpoints, or 3 for Kidderminster–farmSouth–Worcester */
  endpoints: readonly LocationId[];
  canal: boolean;
  rail: boolean;
}

/** What a merchant tile buys */
export type MerchantTileKind = 'any' | 'cotton' | 'goods' | 'pottery' | 'blank';

export type PlayerId = number;

export interface PlacedIndustry {
  owner: PlayerId;
  industry: IndustryType;
  level: number;
  flipped: boolean;
  /** Coal/iron cubes or beer barrels remaining on the tile */
  resources: number;
}

export interface PlacedLink {
  owner: PlayerId;
  linkId: string;
  kind: 'canal' | 'rail';
}
