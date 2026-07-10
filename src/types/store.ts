export interface StationeryStore {
  id: string;
  name: string;
  address: string;
  latitude: number;
  longitude: number;
  website?: string;
  state: string;
  country: string;
  phone?: string;
  hours?: string;
}

export interface StateGroup {
  name: string;
  isExpanded: boolean;
  stores: StationeryStore[];
}

export interface CountryGroup {
  name: string;
  isExpanded: boolean;
  states: { [key: string]: StateGroup };
}
