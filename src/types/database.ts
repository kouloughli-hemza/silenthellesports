// =============================================================================
// Generated types — keep in sync with supabase/migrations/*.sql
// Replace via `npm run db:types` once SUPABASE_PROJECT_REF is set.
// Until then, this is hand-authored to mirror the SQL exactly.
// =============================================================================

export type Json = string | number | boolean | null | { [key: string]: Json | undefined } | Json[];

export type Translated = { en: string; ar: string };

export type Database = {
  __InternalSupabase: {
    PostgrestVersion: "12";
  };
  public: {
    Tables: {
      profiles: {
        Row: {
          id: string;
          email: string;
          full_name: string | null;
          role: "customer" | "admin";
          phone: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id: string;
          email: string;
          full_name?: string | null;
          role?: "customer" | "admin";
          phone?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          email?: string;
          full_name?: string | null;
          role?: "customer" | "admin";
          phone?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Relationships: [];
      };
      site_config: {
        Row: { key: string; value: Json; updated_at: string; updated_by: string | null };
        Insert: { key: string; value: Json; updated_at?: string; updated_by?: string | null };
        Update: {
          key?: string;
          value?: Json;
          updated_at?: string;
          updated_by?: string | null;
        };
        Relationships: [];
      };
      players: {
        Row: {
          id: string;
          ign: string;
          real_name: string | null;
          role:
            | "IGL"
            | "Sniper"
            | "Fragger"
            | "Support"
            | "Coach"
            | "Manager"
            | "Sub"
            | "Analyst"
            | "Assault"
            | "Scout";
          country_code: string | null;
          photo_url: string | null;
          bio: Json;
          signature_loadout: string | null;
          highlight_url: string | null;
          stats: Json;
          socials: Json;
          display_order: number;
          is_active: boolean;
          joined_at: string | null;
          left_at: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          ign: string;
          real_name?: string | null;
          role:
            | "IGL"
            | "Sniper"
            | "Fragger"
            | "Support"
            | "Coach"
            | "Manager"
            | "Sub"
            | "Analyst"
            | "Assault"
            | "Scout";
          country_code?: string | null;
          photo_url?: string | null;
          bio?: Json;
          signature_loadout?: string | null;
          highlight_url?: string | null;
          stats?: Json;
          socials?: Json;
          display_order?: number;
          is_active?: boolean;
          joined_at?: string | null;
          left_at?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          ign?: string;
          real_name?: string | null;
          role?:
            | "IGL"
            | "Sniper"
            | "Fragger"
            | "Support"
            | "Coach"
            | "Manager"
            | "Sub"
            | "Analyst"
            | "Assault"
            | "Scout";
          country_code?: string | null;
          photo_url?: string | null;
          bio?: Json;
          signature_loadout?: string | null;
          highlight_url?: string | null;
          stats?: Json;
          socials?: Json;
          display_order?: number;
          is_active?: boolean;
          joined_at?: string | null;
          left_at?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Relationships: [];
      };
      trophies: {
        Row: {
          id: string;
          title: Json;
          tournament_name: string;
          placement: string;
          prize_amount: number | null;
          prize_currency: string;
          date: string;
          logo_url: string | null;
          display_order: number;
          created_at: string;
        };
        Insert: {
          id?: string;
          title: Json;
          tournament_name: string;
          placement: string;
          prize_amount?: number | null;
          prize_currency?: string;
          date: string;
          logo_url?: string | null;
          display_order?: number;
          created_at?: string;
        };
        Update: {
          id?: string;
          title?: Json;
          tournament_name?: string;
          placement?: string;
          prize_amount?: number | null;
          prize_currency?: string;
          date?: string;
          logo_url?: string | null;
          display_order?: number;
          created_at?: string;
        };
        Relationships: [];
      };
      tactic_boards: {
        Row: {
          id: string;
          title: Json;
          description: Json;
          map_name: string;
          map_image_url: string | null;
          drop_x: number;
          drop_y: number;
          rotation_points: Json;
          display_order: number;
          is_published: boolean;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          title: Json;
          description?: Json;
          map_name: string;
          map_image_url?: string | null;
          drop_x: number;
          drop_y: number;
          rotation_points?: Json;
          display_order?: number;
          is_published?: boolean;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          title?: Json;
          description?: Json;
          map_name?: string;
          map_image_url?: string | null;
          drop_x?: number;
          drop_y?: number;
          rotation_points?: Json;
          display_order?: number;
          is_published?: boolean;
          created_at?: string;
          updated_at?: string;
        };
        Relationships: [];
      };
      team_milestones: {
        Row: {
          id: string;
          occurred_on: string;
          category:
            | "founding"
            | "tournament_win"
            | "roster"
            | "milestone"
            | "release"
            | "partnership"
            | "other";
          title: Json;
          description: Json;
          image_url: string | null;
          display_order: number;
          is_published: boolean;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          occurred_on: string;
          category:
            | "founding"
            | "tournament_win"
            | "roster"
            | "milestone"
            | "release"
            | "partnership"
            | "other";
          title: Json;
          description?: Json;
          image_url?: string | null;
          display_order?: number;
          is_published?: boolean;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          occurred_on?: string;
          category?:
            | "founding"
            | "tournament_win"
            | "roster"
            | "milestone"
            | "release"
            | "partnership"
            | "other";
          title?: Json;
          description?: Json;
          image_url?: string | null;
          display_order?: number;
          is_published?: boolean;
          created_at?: string;
          updated_at?: string;
        };
        Relationships: [];
      };
      gallery_images: {
        Row: {
          id: string;
          image_url: string;
          caption: Json;
          meta: Json;
          hud_heading: string | null;
          hud_zone: string | null;
          hud_signal: string | null;
          display_order: number;
          is_active: boolean;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          image_url: string;
          caption?: Json;
          meta?: Json;
          hud_heading?: string | null;
          hud_zone?: string | null;
          hud_signal?: string | null;
          display_order?: number;
          is_active?: boolean;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          image_url?: string;
          caption?: Json;
          meta?: Json;
          hud_heading?: string | null;
          hud_zone?: string | null;
          hud_signal?: string | null;
          display_order?: number;
          is_active?: boolean;
          created_at?: string;
          updated_at?: string;
        };
        Relationships: [];
      };
      team_stats: {
        Row: {
          id: string;
          key: string;
          label: Json;
          value: number;
          suffix: string | null;
          display_order: number;
          is_published: boolean;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          key: string;
          label: Json;
          value?: number;
          suffix?: string | null;
          display_order?: number;
          is_published?: boolean;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          key?: string;
          label?: Json;
          value?: number;
          suffix?: string | null;
          display_order?: number;
          is_published?: boolean;
          created_at?: string;
          updated_at?: string;
        };
        Relationships: [];
      };
      events: {
        Row: {
          id: string;
          slug: string;
          title: Json;
          description: Json;
          mode: "Solo" | "Duo" | "Squad";
          map: string | null;
          maps: Json;
          prize_pool: number;
          prize_currency: string;
          entry_fee: number;
          capacity: number;
          start_at: string;
          registration_closes_at: string;
          status: "upcoming" | "open" | "closed" | "live" | "completed" | "cancelled";
          cover_image_url: string | null;
          rules: Json;
          tag: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          slug: string;
          title: Json;
          description?: Json;
          mode: "Solo" | "Duo" | "Squad";
          map?: string | null;
          maps?: Json;
          prize_pool?: number;
          prize_currency?: string;
          entry_fee?: number;
          capacity: number;
          start_at: string;
          registration_closes_at: string;
          status?: "upcoming" | "open" | "closed" | "live" | "completed" | "cancelled";
          cover_image_url?: string | null;
          rules?: Json;
          tag?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          slug?: string;
          title?: Json;
          description?: Json;
          mode?: "Solo" | "Duo" | "Squad";
          map?: string | null;
          maps?: Json;
          prize_pool?: number;
          prize_currency?: string;
          entry_fee?: number;
          capacity?: number;
          start_at?: string;
          registration_closes_at?: string;
          status?: "upcoming" | "open" | "closed" | "live" | "completed" | "cancelled";
          cover_image_url?: string | null;
          rules?: Json;
          tag?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Relationships: [];
      };
      event_signups: {
        Row: {
          id: string;
          event_id: string;
          user_id: string | null;
          ign: string;
          pubg_uid: string;
          discord_tag: string;
          contact_phone: string;
          squad_members: Json;
          payment_status: "pending" | "paid" | "waived" | "refunded";
          status: "registered" | "checked_in" | "disqualified" | "withdrawn";
          notes: string | null;
          confirmation_code: string;
          created_at: string;
        };
        Insert: {
          id?: string;
          event_id: string;
          user_id?: string | null;
          ign: string;
          pubg_uid: string;
          discord_tag: string;
          contact_phone: string;
          squad_members?: Json;
          payment_status?: "pending" | "paid" | "waived" | "refunded";
          status?: "registered" | "checked_in" | "disqualified" | "withdrawn";
          notes?: string | null;
          confirmation_code?: string;
          created_at?: string;
        };
        Update: {
          id?: string;
          event_id?: string;
          user_id?: string | null;
          ign?: string;
          pubg_uid?: string;
          discord_tag?: string;
          contact_phone?: string;
          squad_members?: Json;
          payment_status?: "pending" | "paid" | "waived" | "refunded";
          status?: "registered" | "checked_in" | "disqualified" | "withdrawn";
          notes?: string | null;
          confirmation_code?: string;
          created_at?: string;
        };
        Relationships: [];
      };
      products: {
        Row: {
          id: string;
          slug: string;
          name: Json;
          description: Json;
          category:
            | "tee"
            | "hoodie"
            | "jersey"
            | "mousepad"
            | "cap"
            | "sticker"
            | "lanyard"
            | "other";
          base_price: number;
          worn_by_player_id: string | null;
          images: string[];
          is_active: boolean;
          is_featured: boolean;
          customization_enabled: boolean;
          weight_grams: number;
          display_order: number;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          slug: string;
          name: Json;
          description?: Json;
          category:
            | "tee"
            | "hoodie"
            | "jersey"
            | "mousepad"
            | "cap"
            | "sticker"
            | "lanyard"
            | "other";
          base_price: number;
          worn_by_player_id?: string | null;
          images?: string[];
          is_active?: boolean;
          is_featured?: boolean;
          customization_enabled?: boolean;
          weight_grams?: number;
          display_order?: number;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          slug?: string;
          name?: Json;
          description?: Json;
          category?:
            | "tee"
            | "hoodie"
            | "jersey"
            | "mousepad"
            | "cap"
            | "sticker"
            | "lanyard"
            | "other";
          base_price?: number;
          worn_by_player_id?: string | null;
          images?: string[];
          is_active?: boolean;
          is_featured?: boolean;
          customization_enabled?: boolean;
          weight_grams?: number;
          display_order?: number;
          created_at?: string;
          updated_at?: string;
        };
        Relationships: [];
      };
      product_variants: {
        Row: {
          id: string;
          product_id: string;
          sku: string;
          size: string | null;
          color: string | null;
          price_override: number | null;
          stock_quantity: number;
          is_active: boolean;
          created_at: string;
        };
        Insert: {
          id?: string;
          product_id: string;
          sku: string;
          size?: string | null;
          color?: string | null;
          price_override?: number | null;
          stock_quantity?: number;
          is_active?: boolean;
          created_at?: string;
        };
        Update: {
          id?: string;
          product_id?: string;
          sku?: string;
          size?: string | null;
          color?: string | null;
          price_override?: number | null;
          stock_quantity?: number;
          is_active?: boolean;
          created_at?: string;
        };
        Relationships: [];
      };
      orders: {
        Row: {
          id: string;
          order_number: string;
          user_id: string | null;
          customer_name: string;
          customer_phone: string;
          customer_email: string | null;
          shipping_wilaya_code: number;
          shipping_commune_name: string;
          shipping_address: string;
          is_stopdesk: boolean;
          stopdesk_id: number | null;
          subtotal: number;
          shipping_fee: number;
          total: number;
          currency: string;
          status:
            | "pending"
            | "confirmed"
            | "shipped"
            | "delivered"
            | "cancelled"
            | "returned";
          yalidine_tracking: string | null;
          yalidine_status: string | null;
          notes: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          order_number?: string;
          user_id?: string | null;
          customer_name: string;
          customer_phone: string;
          customer_email?: string | null;
          shipping_wilaya_code: number;
          shipping_commune_name: string;
          shipping_address: string;
          is_stopdesk?: boolean;
          stopdesk_id?: number | null;
          subtotal: number;
          shipping_fee: number;
          total: number;
          currency?: string;
          status?:
            | "pending"
            | "confirmed"
            | "shipped"
            | "delivered"
            | "cancelled"
            | "returned";
          yalidine_tracking?: string | null;
          yalidine_status?: string | null;
          notes?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          order_number?: string;
          user_id?: string | null;
          customer_name?: string;
          customer_phone?: string;
          customer_email?: string | null;
          shipping_wilaya_code?: number;
          shipping_commune_name?: string;
          shipping_address?: string;
          is_stopdesk?: boolean;
          stopdesk_id?: number | null;
          subtotal?: number;
          shipping_fee?: number;
          total?: number;
          currency?: string;
          status?:
            | "pending"
            | "confirmed"
            | "shipped"
            | "delivered"
            | "cancelled"
            | "returned";
          yalidine_tracking?: string | null;
          yalidine_status?: string | null;
          notes?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Relationships: [];
      };
      order_items: {
        Row: {
          id: string;
          order_id: string;
          product_id: string;
          variant_id: string | null;
          product_name_snapshot: string;
          variant_label_snapshot: string | null;
          custom_name: string | null;
          quantity: number;
          unit_price: number;
          line_total: number;
        };
        Insert: {
          id?: string;
          order_id: string;
          product_id: string;
          variant_id?: string | null;
          product_name_snapshot: string;
          variant_label_snapshot?: string | null;
          custom_name?: string | null;
          quantity: number;
          unit_price: number;
          line_total: number;
        };
        Update: {
          id?: string;
          order_id?: string;
          product_id?: string;
          variant_id?: string | null;
          product_name_snapshot?: string;
          variant_label_snapshot?: string | null;
          custom_name?: string | null;
          quantity?: number;
          unit_price?: number;
          line_total?: number;
        };
        Relationships: [];
      };
      giveaways: {
        Row: {
          id: string;
          slug: string;
          title: Json;
          description: Json;
          prize_description: Json;
          prize_image_url: string | null;
          estimated_value: string | null;
          entry_methods: Json;
          starts_at: string;
          ends_at: string;
          status: "upcoming" | "active" | "drawing" | "completed";
          winner_user_id: string | null;
          winner_email: string | null;
          winner_entry_id: string | null;
          winner_announcement: Json;
          drop_number: number | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          slug: string;
          title: Json;
          description?: Json;
          prize_description: Json;
          prize_image_url?: string | null;
          estimated_value?: string | null;
          entry_methods?: Json;
          starts_at: string;
          ends_at: string;
          status?: "upcoming" | "active" | "drawing" | "completed";
          winner_user_id?: string | null;
          winner_email?: string | null;
          winner_entry_id?: string | null;
          winner_announcement?: Json;
          drop_number?: number | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          slug?: string;
          title?: Json;
          description?: Json;
          prize_description?: Json;
          prize_image_url?: string | null;
          estimated_value?: string | null;
          entry_methods?: Json;
          starts_at?: string;
          ends_at?: string;
          status?: "upcoming" | "active" | "drawing" | "completed";
          winner_user_id?: string | null;
          winner_email?: string | null;
          winner_entry_id?: string | null;
          winner_announcement?: Json;
          drop_number?: number | null;
          created_at?: string;
          updated_at?: string;
        };
        Relationships: [];
      };
      giveaway_entries: {
        Row: {
          id: string;
          giveaway_id: string;
          user_id: string | null;
          email: string;
          discord_tag: string | null;
          completed_methods: Json;
          entry_count: number;
          created_at: string;
        };
        Insert: {
          id?: string;
          giveaway_id: string;
          user_id?: string | null;
          email: string;
          discord_tag?: string | null;
          completed_methods?: Json;
          entry_count?: number;
          created_at?: string;
        };
        Update: {
          id?: string;
          giveaway_id?: string;
          user_id?: string | null;
          email?: string;
          discord_tag?: string | null;
          completed_methods?: Json;
          entry_count?: number;
          created_at?: string;
        };
        Relationships: [];
      };
      pages: {
        Row: {
          id: string;
          slug: string;
          title: Json;
          body: Json;
          is_published: boolean;
          meta_description: Json;
          updated_at: string;
          updated_by: string | null;
        };
        Insert: {
          id?: string;
          slug: string;
          title: Json;
          body: Json;
          is_published?: boolean;
          meta_description?: Json;
          updated_at?: string;
          updated_by?: string | null;
        };
        Update: {
          id?: string;
          slug?: string;
          title?: Json;
          body?: Json;
          is_published?: boolean;
          meta_description?: Json;
          updated_at?: string;
          updated_by?: string | null;
        };
        Relationships: [];
      };
      admin_audit_log: {
        Row: {
          id: string;
          actor_id: string | null;
          action: string;
          entity_type: string;
          entity_id: string | null;
          before: Json | null;
          after: Json | null;
          ip: string | null;
          user_agent: string | null;
          created_at: string;
        };
        Insert: {
          id?: string;
          actor_id?: string | null;
          action: string;
          entity_type: string;
          entity_id?: string | null;
          before?: Json | null;
          after?: Json | null;
          ip?: string | null;
          user_agent?: string | null;
          created_at?: string;
        };
        Update: {
          id?: string;
          actor_id?: string | null;
          action?: string;
          entity_type?: string;
          entity_id?: string | null;
          before?: Json | null;
          after?: Json | null;
          ip?: string | null;
          user_agent?: string | null;
          created_at?: string;
        };
        Relationships: [];
      };
      yalidine_cache: {
        Row: { key: string; value: Json; refreshed_at: string };
        Insert: { key: string; value: Json; refreshed_at?: string };
        Update: { key?: string; value?: Json; refreshed_at?: string };
        Relationships: [];
      };
    };
    Views: { [_ in never]: never };
    Functions: {
      is_admin: { Args: Record<string, never>; Returns: boolean };
      close_stale_events: { Args: Record<string, never>; Returns: number };
    };
    Enums: { [_ in never]: never };
    CompositeTypes: { [_ in never]: never };
  };
};

export type TableName = keyof Database["public"]["Tables"];
export type Row<T extends TableName> = Database["public"]["Tables"][T]["Row"];
export type Insert<T extends TableName> = Database["public"]["Tables"][T]["Insert"];
export type Update<T extends TableName> = Database["public"]["Tables"][T]["Update"];
