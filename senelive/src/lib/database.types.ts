// Généré depuis le projet Supabase SeneLive (rmnsevkzdjapjmjnagye).
// Régénérer après toute migration.
export type Json = string | number | boolean | null | { [key: string]: Json | undefined } | Json[];

export type Database = {
  __InternalSupabase: { PostgrestVersion: '14.5' };
  public: {
    Tables: {
      categories: {
        Row: { id: number; name: string; parent_id: number | null; position: number; slug: string };
        Insert: { id?: never; name: string; parent_id?: number | null; position?: number; slug: string };
        Update: { id?: never; name?: string; parent_id?: number | null; position?: number; slug?: string };
        Relationships: [
          {
            foreignKeyName: 'categories_parent_id_fkey';
            columns: ['parent_id'];
            isOneToOne: false;
            referencedRelation: 'categories';
            referencedColumns: ['id'];
          },
        ];
      };
      cities: {
        Row: { id: number; name: string; region_id: number; slug: string };
        Insert: { id?: never; name: string; region_id: number; slug: string };
        Update: { id?: never; name?: string; region_id?: number; slug?: string };
        Relationships: [
          {
            foreignKeyName: 'cities_region_id_fkey';
            columns: ['region_id'];
            isOneToOne: false;
            referencedRelation: 'regions';
            referencedColumns: ['id'];
          },
        ];
      };
      follows: {
        Row: { created_at: string; follower_id: string; shop_id: string };
        Insert: { created_at?: string; follower_id: string; shop_id: string };
        Update: { created_at?: string; follower_id?: string; shop_id?: string };
        Relationships: [
          {
            foreignKeyName: 'follows_follower_id_fkey';
            columns: ['follower_id'];
            isOneToOne: false;
            referencedRelation: 'profiles';
            referencedColumns: ['id'];
          },
          {
            foreignKeyName: 'follows_shop_id_fkey';
            columns: ['shop_id'];
            isOneToOne: false;
            referencedRelation: 'shops';
            referencedColumns: ['id'];
          },
        ];
      };
      listing_images: {
        Row: { created_at: string; id: string; listing_id: string; path: string; position: number };
        Insert: { created_at?: string; id?: string; listing_id: string; path: string; position?: number };
        Update: { created_at?: string; id?: string; listing_id?: string; path?: string; position?: number };
        Relationships: [
          {
            foreignKeyName: 'listing_images_listing_id_fkey';
            columns: ['listing_id'];
            isOneToOne: false;
            referencedRelation: 'listings';
            referencedColumns: ['id'];
          },
        ];
      };
      listings: {
        Row: {
          category_id: number | null;
          compare_at_price: number | null;
          condition: Database['public']['Enums']['listing_condition'];
          created_at: string;
          description: string | null;
          id: string;
          price: number;
          quantity: number;
          shop_id: string;
          status: Database['public']['Enums']['listing_status'];
          title: string;
          updated_at: string;
        };
        Insert: {
          category_id?: number | null;
          compare_at_price?: number | null;
          condition?: Database['public']['Enums']['listing_condition'];
          created_at?: string;
          description?: string | null;
          id?: string;
          price: number;
          quantity?: number;
          shop_id: string;
          status?: Database['public']['Enums']['listing_status'];
          title: string;
          updated_at?: string;
        };
        Update: {
          category_id?: number | null;
          compare_at_price?: number | null;
          condition?: Database['public']['Enums']['listing_condition'];
          created_at?: string;
          description?: string | null;
          id?: string;
          price?: number;
          quantity?: number;
          shop_id?: string;
          status?: Database['public']['Enums']['listing_status'];
          title?: string;
          updated_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: 'listings_category_id_fkey';
            columns: ['category_id'];
            isOneToOne: false;
            referencedRelation: 'categories';
            referencedColumns: ['id'];
          },
          {
            foreignKeyName: 'listings_shop_id_fkey';
            columns: ['shop_id'];
            isOneToOne: false;
            referencedRelation: 'shops';
            referencedColumns: ['id'];
          },
        ];
      };
      order_items: {
        Row: {
          id: string;
          line_total: number | null;
          listing_id: string | null;
          order_id: string;
          quantity: number;
          title: string;
          unit_price: number;
        };
        Insert: {
          id?: string;
          line_total?: never;
          listing_id?: string | null;
          order_id: string;
          quantity: number;
          title: string;
          unit_price: number;
        };
        Update: {
          id?: string;
          line_total?: never;
          listing_id?: string | null;
          order_id?: string;
          quantity?: number;
          title?: string;
          unit_price?: number;
        };
        Relationships: [
          {
            foreignKeyName: 'order_items_listing_id_fkey';
            columns: ['listing_id'];
            isOneToOne: false;
            referencedRelation: 'listings';
            referencedColumns: ['id'];
          },
          {
            foreignKeyName: 'order_items_order_id_fkey';
            columns: ['order_id'];
            isOneToOne: false;
            referencedRelation: 'orders';
            referencedColumns: ['id'];
          },
        ];
      };
      orders: {
        Row: {
          buyer_id: string;
          buyer_note: string | null;
          created_at: string;
          delivery_address: string | null;
          delivery_city_id: number | null;
          delivery_fee: number;
          delivery_phone: string | null;
          id: string;
          order_number: string;
          payment_method: Database['public']['Enums']['payment_method'];
          payment_status: Database['public']['Enums']['payment_status'];
          shop_id: string;
          status: Database['public']['Enums']['order_status'];
          subtotal: number;
          total: number;
          updated_at: string;
        };
        Insert: {
          buyer_id: string;
          buyer_note?: string | null;
          created_at?: string;
          delivery_address?: string | null;
          delivery_city_id?: number | null;
          delivery_fee?: number;
          delivery_phone?: string | null;
          id?: string;
          order_number: string;
          payment_method?: Database['public']['Enums']['payment_method'];
          payment_status?: Database['public']['Enums']['payment_status'];
          shop_id: string;
          status?: Database['public']['Enums']['order_status'];
          subtotal?: number;
          total?: number;
          updated_at?: string;
        };
        Update: {
          buyer_id?: string;
          buyer_note?: string | null;
          created_at?: string;
          delivery_address?: string | null;
          delivery_city_id?: number | null;
          delivery_fee?: number;
          delivery_phone?: string | null;
          id?: string;
          order_number?: string;
          payment_method?: Database['public']['Enums']['payment_method'];
          payment_status?: Database['public']['Enums']['payment_status'];
          shop_id?: string;
          status?: Database['public']['Enums']['order_status'];
          subtotal?: number;
          total?: number;
          updated_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: 'orders_buyer_id_fkey';
            columns: ['buyer_id'];
            isOneToOne: false;
            referencedRelation: 'profiles';
            referencedColumns: ['id'];
          },
          {
            foreignKeyName: 'orders_delivery_city_id_fkey';
            columns: ['delivery_city_id'];
            isOneToOne: false;
            referencedRelation: 'cities';
            referencedColumns: ['id'];
          },
          {
            foreignKeyName: 'orders_shop_id_fkey';
            columns: ['shop_id'];
            isOneToOne: false;
            referencedRelation: 'shops';
            referencedColumns: ['id'];
          },
        ];
      };
      profiles: {
        Row: {
          avatar_url: string | null;
          bio: string | null;
          city_id: number | null;
          created_at: string;
          full_name: string | null;
          id: string;
          neighborhood: string | null;
          phone: string | null;
          phone_verified_at: string | null;
          role: Database['public']['Enums']['user_role'];
          updated_at: string;
          username: string | null;
        };
        Insert: {
          avatar_url?: string | null;
          bio?: string | null;
          city_id?: number | null;
          created_at?: string;
          full_name?: string | null;
          id: string;
          neighborhood?: string | null;
          phone?: string | null;
          phone_verified_at?: string | null;
          role?: Database['public']['Enums']['user_role'];
          updated_at?: string;
          username?: string | null;
        };
        Update: {
          avatar_url?: string | null;
          bio?: string | null;
          city_id?: number | null;
          created_at?: string;
          full_name?: string | null;
          id?: string;
          neighborhood?: string | null;
          phone?: string | null;
          phone_verified_at?: string | null;
          role?: Database['public']['Enums']['user_role'];
          updated_at?: string;
          username?: string | null;
        };
        Relationships: [
          {
            foreignKeyName: 'profiles_city_id_fkey';
            columns: ['city_id'];
            isOneToOne: false;
            referencedRelation: 'cities';
            referencedColumns: ['id'];
          },
        ];
      };
      regions: {
        Row: { id: number; name: string; slug: string };
        Insert: { id?: never; name: string; slug: string };
        Update: { id?: never; name?: string; slug?: string };
        Relationships: [];
      };
      reviews: {
        Row: {
          author_name: string | null;
          buyer_id: string;
          comment: string | null;
          created_at: string;
          id: string;
          order_id: string;
          rating: number;
          shop_id: string;
        };
        Insert: {
          author_name?: string | null;
          buyer_id: string;
          comment?: string | null;
          created_at?: string;
          id?: string;
          order_id: string;
          rating: number;
          shop_id: string;
        };
        Update: {
          author_name?: string | null;
          buyer_id?: string;
          comment?: string | null;
          created_at?: string;
          id?: string;
          order_id?: string;
          rating?: number;
          shop_id?: string;
        };
        Relationships: [
          {
            foreignKeyName: 'reviews_buyer_id_fkey';
            columns: ['buyer_id'];
            isOneToOne: false;
            referencedRelation: 'profiles';
            referencedColumns: ['id'];
          },
          {
            foreignKeyName: 'reviews_order_id_fkey';
            columns: ['order_id'];
            isOneToOne: true;
            referencedRelation: 'orders';
            referencedColumns: ['id'];
          },
          {
            foreignKeyName: 'reviews_shop_id_fkey';
            columns: ['shop_id'];
            isOneToOne: false;
            referencedRelation: 'shops';
            referencedColumns: ['id'];
          },
        ];
      };
      shops: {
        Row: {
          banner_url: string | null;
          city_id: number | null;
          created_at: string;
          description: string | null;
          id: string;
          is_active: boolean;
          logo_url: string | null;
          name: string;
          neighborhood: string | null;
          owner_id: string;
          rating_avg: number;
          rating_count: number;
          slug: string;
          updated_at: string;
          verification: Database['public']['Enums']['verification_status'];
          verified_at: string | null;
          whatsapp: string | null;
        };
        Insert: {
          banner_url?: string | null;
          city_id?: number | null;
          created_at?: string;
          description?: string | null;
          id?: string;
          is_active?: boolean;
          logo_url?: string | null;
          name: string;
          neighborhood?: string | null;
          owner_id: string;
          rating_avg?: number;
          rating_count?: number;
          slug: string;
          updated_at?: string;
          verification?: Database['public']['Enums']['verification_status'];
          verified_at?: string | null;
          whatsapp?: string | null;
        };
        Update: {
          banner_url?: string | null;
          city_id?: number | null;
          created_at?: string;
          description?: string | null;
          id?: string;
          is_active?: boolean;
          logo_url?: string | null;
          name?: string;
          neighborhood?: string | null;
          owner_id?: string;
          rating_avg?: number;
          rating_count?: number;
          slug?: string;
          updated_at?: string;
          verification?: Database['public']['Enums']['verification_status'];
          verified_at?: string | null;
          whatsapp?: string | null;
        };
        Relationships: [
          {
            foreignKeyName: 'shops_city_id_fkey';
            columns: ['city_id'];
            isOneToOne: false;
            referencedRelation: 'cities';
            referencedColumns: ['id'];
          },
          {
            foreignKeyName: 'shops_owner_id_fkey';
            columns: ['owner_id'];
            isOneToOne: true;
            referencedRelation: 'profiles';
            referencedColumns: ['id'];
          },
        ];
      };
      show_listings: {
        Row: { featured_at: string | null; listing_id: string; position: number; show_id: string };
        Insert: { featured_at?: string | null; listing_id: string; position?: number; show_id: string };
        Update: { featured_at?: string | null; listing_id?: string; position?: number; show_id?: string };
        Relationships: [
          {
            foreignKeyName: 'show_listings_listing_id_fkey';
            columns: ['listing_id'];
            isOneToOne: false;
            referencedRelation: 'listings';
            referencedColumns: ['id'];
          },
          {
            foreignKeyName: 'show_listings_show_id_fkey';
            columns: ['show_id'];
            isOneToOne: false;
            referencedRelation: 'shows';
            referencedColumns: ['id'];
          },
        ];
      };
      show_messages: {
        Row: {
          author_id: string;
          author_name: string | null;
          body: string;
          created_at: string;
          id: string;
          show_id: string;
        };
        Insert: {
          author_id: string;
          author_name?: string | null;
          body: string;
          created_at?: string;
          id?: string;
          show_id: string;
        };
        Update: {
          author_id?: string;
          author_name?: string | null;
          body?: string;
          created_at?: string;
          id?: string;
          show_id?: string;
        };
        Relationships: [
          {
            foreignKeyName: 'show_messages_author_id_fkey';
            columns: ['author_id'];
            isOneToOne: false;
            referencedRelation: 'profiles';
            referencedColumns: ['id'];
          },
          {
            foreignKeyName: 'show_messages_show_id_fkey';
            columns: ['show_id'];
            isOneToOne: false;
            referencedRelation: 'shows';
            referencedColumns: ['id'];
          },
        ];
      };
      shows: {
        Row: {
          created_at: string;
          ended_at: string | null;
          id: string;
          room: string | null;
          scheduled_at: string | null;
          shop_id: string;
          started_at: string | null;
          status: Database['public']['Enums']['show_status'];
          thumbnail_url: string | null;
          title: string;
          updated_at: string;
          viewer_count: number;
        };
        Insert: {
          created_at?: string;
          ended_at?: string | null;
          id?: string;
          room?: string | null;
          scheduled_at?: string | null;
          shop_id: string;
          started_at?: string | null;
          status?: Database['public']['Enums']['show_status'];
          thumbnail_url?: string | null;
          title: string;
          updated_at?: string;
          viewer_count?: number;
        };
        Update: {
          created_at?: string;
          ended_at?: string | null;
          id?: string;
          room?: string | null;
          scheduled_at?: string | null;
          shop_id?: string;
          started_at?: string | null;
          status?: Database['public']['Enums']['show_status'];
          thumbnail_url?: string | null;
          title?: string;
          updated_at?: string;
          viewer_count?: number;
        };
        Relationships: [
          {
            foreignKeyName: 'shows_shop_id_fkey';
            columns: ['shop_id'];
            isOneToOne: false;
            referencedRelation: 'shops';
            referencedColumns: ['id'];
          },
        ];
      };
    };
    Views: { [_ in never]: never };
    Functions: {
      place_order: {
        Args: {
          p_buyer_note?: string;
          p_delivery_address: string;
          p_delivery_city_id: number;
          p_delivery_phone: string;
          p_listing_id: string;
          p_payment_method: Database['public']['Enums']['payment_method'];
          p_quantity: number;
        };
        Returns: string;
      };
    };
    Enums: {
      listing_condition: 'new' | 'like_new' | 'good' | 'fair';
      listing_status: 'draft' | 'active' | 'sold' | 'archived';
      order_status: 'pending' | 'confirmed' | 'shipped' | 'delivered' | 'cancelled' | 'refunded';
      payment_method: 'wave' | 'orange_money' | 'free_money' | 'cash_on_delivery' | 'card';
      payment_status: 'pending' | 'paid' | 'failed' | 'refunded';
      show_status: 'scheduled' | 'live' | 'ended' | 'cancelled';
      user_role: 'buyer' | 'seller' | 'admin';
      verification_status: 'unverified' | 'pending' | 'verified' | 'rejected';
    };
    CompositeTypes: { [_ in never]: never };
  };
};

type DefaultSchema = Database['public'];

export type Tables<T extends keyof DefaultSchema['Tables']> = DefaultSchema['Tables'][T]['Row'];
export type TablesInsert<T extends keyof DefaultSchema['Tables']> = DefaultSchema['Tables'][T]['Insert'];
export type TablesUpdate<T extends keyof DefaultSchema['Tables']> = DefaultSchema['Tables'][T]['Update'];
export type Enums<T extends keyof DefaultSchema['Enums']> = DefaultSchema['Enums'][T];
