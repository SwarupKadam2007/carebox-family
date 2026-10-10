/**
 * TypeScript types generated from the Supabase schema.
 * Matches exactly the tables in migrations/20261011000001_initial_schema.sql
 * In a live project, run: supabase gen types typescript --local > src/types/database.ts
 */

export type Json = string | number | boolean | null | { [key: string]: Json | undefined } | Json[];

export interface Database {
  public: {
    Tables: {
      profiles: {
        Row: {
          id: string;
          name: string;
          avatar_url: string | null;
          created_at: string;
        };
        Insert: {
          id: string;
          name: string;
          avatar_url?: string | null;
          created_at?: string;
        };
        Update: {
          id?: string;
          name?: string;
          avatar_url?: string | null;
        };
      };
      families: {
        Row: {
          id: string;
          name: string;
          created_by: string | null;
          created_at: string;
        };
        Insert: {
          id?: string;
          name: string;
          created_by?: string | null;
        };
        Update: {
          name?: string;
        };
      };
      members: {
        Row: {
          id: string;
          family_id: string;
          user_id: string;
          role: 'admin' | 'viewer';
          status: 'invited' | 'active' | 'removed';
          invited_by: string | null;
          created_at: string;
        };
        Insert: {
          id?: string;
          family_id: string;
          user_id: string;
          role?: 'admin' | 'viewer';
          status?: 'invited' | 'active' | 'removed';
          invited_by?: string | null;
        };
        Update: {
          role?: 'admin' | 'viewer';
          status?: 'invited' | 'active' | 'removed';
        };
      };
      parents: {
        Row: {
          id: string;
          family_id: string;
          name: string;
          photo_url: string | null;
          sharing_paused: boolean;
          timezone: string;
          nudge_delay_min: number;
          created_at: string;
        };
        Insert: {
          id?: string;
          family_id: string;
          name: string;
          photo_url?: string | null;
          sharing_paused?: boolean;
          timezone?: string;
          nudge_delay_min?: number;
        };
        Update: {
          name?: string;
          photo_url?: string | null;
          sharing_paused?: boolean;
          nudge_delay_min?: number;
        };
      };
      boxes: {
        Row: {
          id: string;
          parent_id: string;
          device_token_hash: string;
          qr_code: string | null;
          last_seen: string | null;
          created_at: string;
        };
        Insert: {
          id?: string;
          parent_id: string;
          device_token_hash: string;
          qr_code?: string | null;
        };
        Update: {
          last_seen?: string | null;
        };
      };
      medicines: {
        Row: {
          id: string;
          parent_id: string;
          name: string;
          strength: string | null;
          dosage_text: string | null;
          slot: 'morning' | 'afternoon' | 'night' | 'both';
          pills_left: number;
          pills_per_dose: number;
          active: boolean;
          created_at: string;
        };
        Insert: {
          id?: string;
          parent_id: string;
          name: string;
          strength?: string | null;
          dosage_text?: string | null;
          slot: 'morning' | 'afternoon' | 'night' | 'both';
          pills_left?: number;
          pills_per_dose?: number;
          active?: boolean;
        };
        Update: {
          name?: string;
          strength?: string | null;
          dosage_text?: string | null;
          slot?: 'morning' | 'afternoon' | 'night' | 'both';
          pills_left?: number;
          pills_per_dose?: number;
          active?: boolean;
        };
      };
      dose_schedules: {
        Row: {
          id: string;
          parent_id: string;
          slot: 'morning' | 'afternoon' | 'night';
          time_local: string;
          active: boolean;
        };
        Insert: {
          id?: string;
          parent_id: string;
          slot: 'morning' | 'afternoon' | 'night';
          time_local: string;
          active?: boolean;
        };
        Update: {
          time_local?: string;
          active?: boolean;
        };
      };
      dose_events: {
        Row: {
          id: string;
          parent_id: string;
          slot: 'morning' | 'afternoon' | 'night';
          event_date: string;
          taken_at: string;
          source: 'box' | 'manual' | 'simulator';
          created_at: string;
        };
        Insert: {
          id?: string;
          parent_id: string;
          slot: 'morning' | 'afternoon' | 'night';
          event_date?: string;
          taken_at?: string;
          source?: 'box' | 'manual' | 'simulator';
        };
        Update: Record<string, never>;
      };
      reminders: {
        Row: {
          id: string;
          parent_id: string;
          slot: 'morning' | 'afternoon' | 'night';
          reminder_date: string;
          type: 'reminder' | 'call';
          sent_by: string | null;
          sent_at: string;
        };
        Insert: {
          id?: string;
          parent_id: string;
          slot: 'morning' | 'afternoon' | 'night';
          reminder_date?: string;
          type: 'reminder' | 'call';
          sent_by?: string | null;
        };
        Update: Record<string, never>;
      };
      notifications: {
        Row: {
          id: string;
          user_id: string;
          type: string;
          title: string;
          body: string | null;
          payload: Json;
          read_at: string | null;
          created_at: string;
        };
        Insert: {
          id?: string;
          user_id: string;
          type: string;
          title: string;
          body?: string | null;
          payload?: Json;
        };
        Update: {
          read_at?: string | null;
        };
      };
      push_subscriptions: {
        Row: {
          id: string;
          user_id: string;
          endpoint: string;
          keys: Json;
          created_at: string;
        };
        Insert: {
          id?: string;
          user_id: string;
          endpoint: string;
          keys: Json;
        };
        Update: Record<string, never>;
      };
      consents: {
        Row: {
          id: string;
          user_id: string;
          document: 'terms' | 'privacy' | 'medicine_data';
          version: string;
          accepted_at: string;
          ip_hash: string | null;
        };
        Insert: {
          id?: string;
          user_id: string;
          document: 'terms' | 'privacy' | 'medicine_data';
          version: string;
          ip_hash?: string | null;
        };
        Update: Record<string, never>;
      };
      audit_log: {
        Row: {
          id: string;
          actor_id: string | null;
          action: string;
          target: string | null;
          metadata: Json;
          created_at: string;
        };
        Insert: {
          id?: string;
          actor_id?: string | null;
          action: string;
          target?: string | null;
          metadata?: Json;
        };
        Update: Record<string, never>;
      };
    };
    Functions: {
      is_family_member: {
        Args: { f_id: string };
        Returns: boolean;
      };
      is_family_admin: {
        Args: { f_id: string };
        Returns: boolean;
      };
      get_parent_family_id: {
        Args: { p_id: string };
        Returns: string;
      };
      parent_sharing_is_active: {
        Args: { p_id: string };
        Returns: boolean;
      };
    };
  };
}
