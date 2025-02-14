export interface Database {
  public: {
    Tables: {
      saved_competitions: {
        Row: {
          id: string;
          user_id: string;
          name: string;
          date: string;
          location: string;
          type: string;
          criterium_folder_id: string | null;
          participants: any;
          sector_sizes: number[];
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          user_id: string;
          name: string;
          date: string;
          location: string;
          type: string;
          criterium_folder_id?: string | null;
          participants: any;
          sector_sizes: number[];
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          user_id?: string;
          name?: string;
          date?: string;
          location?: string;
          type?: string;
          criterium_folder_id?: string | null;
          participants?: any;
          sector_sizes?: number[];
          created_at?: string;
          updated_at?: string;
        };
      };
      criterium_folders: {
        Row: {
          id: string;
          user_id: string;
          name: string;
          type: string;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          user_id: string;
          name: string;
          type: string;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          user_id?: string;
          name?: string;
          type?: string;
          created_at?: string;
          updated_at?: string;
        };
      };
      club_details: {
        Row: {
          id: string;
          user_id: string;
          name: string;
          street: string;
          postal_code: string;
          city: string;
          country: string;
          phone_numbers: any;
          rules_file_url?: string;
          website?: string;
          email?: string;
          public_name: boolean;
          public_address: boolean;
          public_phone: boolean;
          public_rules: boolean;
          public_website: boolean;
          public_email: boolean;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          user_id: string;
          name: string;
          street: string;
          postal_code: string;
          city: string;
          country: string;
          phone_numbers: any;
          rules_file_url?: string;
          website?: string;
          email?: string;
          public_name?: boolean;
          public_address?: boolean;
          public_phone?: boolean;
          public_rules?: boolean;
          public_website?: boolean;
          public_email?: boolean;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          user_id?: string;
          name?: string;
          street?: string;
          postal_code?: string;
          city?: string;
          country?: string;
          phone_numbers?: any;
          rules_file_url?: string;
          website?: string;
          email?: string;
          public_name?: boolean;
          public_address?: boolean;
          public_phone?: boolean;
          public_rules?: boolean;
          public_website?: boolean;
          public_email?: boolean;
          created_at?: string;
          updated_at?: string;
        };
      };
      weighing_access_links: {
        Row: {
          id: string;
          competition_id: string;
          sectors: string[];
          email: string;
          expires_at: string;
          created_at: string;
          created_by: string;
        };
        Insert: {
          id?: string;
          competition_id: string;
          sectors: string[];
          email: string;
          expires_at: string;
          created_at?: string;
          created_by: string;
        };
        Update: {
          id?: string;
          competition_id?: string;
          sectors?: string[];
          email?: string;
          expires_at?: string;
          created_at?: string;
          created_by?: string;
        };
      };
    };
  };
}