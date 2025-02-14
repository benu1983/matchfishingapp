// Add these types to the existing types.ts file
export type RodType = 'fixed-rod' | 'feeder' | 'open' | 'open-float';
export type CompetitionFormat = 'single' | 'pair' | 'trio' | 'other';
export type AccessType = 'members-only' | 'public';
export type WaterType = 'public' | 'bream-pond' | 'carp-pond' | 'allround-pond';

export interface CalendarEvent {
  id: string;
  date: string;
  name: string;
  type: RodType;
  format: CompetitionFormat;
  access: AccessType;
  water_type: WaterType;
  number_pickup_time: string;
  start_time: string;
  end_time: string;
  postal_code: string;
  city: string;
  country: string;
  latitude?: number;
  longitude?: number;
  poster_url?: string;
  created_at: string;
  updated_at: string;
}