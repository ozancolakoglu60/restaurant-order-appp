export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export interface Database {
  public: {
    Tables: {
      restaurants: {
        Row: {
          id: string
          code: string
          name: string
          iban: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          code: string
          name: string
          iban?: string | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          code?: string
          name?: string
          iban?: string | null
          created_at?: string
          updated_at?: string
        }
      }
      users: {
        Row: {
          id: string
          name: string
          role: 'admin' | 'waiter'
          restaurant_id: string
          created_at: string
          updated_at: string
        }
        Insert: {
          id: string
          name: string
          role: 'admin' | 'waiter'
          restaurant_id: string
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          name?: string
          role?: 'admin' | 'waiter'
          restaurant_id?: string
          created_at?: string
          updated_at?: string
        }
      }
      tables: {
        Row: {
          id: string
          restaurant_id: string
          table_number: number
          status: 'empty' | 'occupied'
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          restaurant_id: string
          table_number: number
          status?: 'empty' | 'occupied'
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          restaurant_id?: string
          table_number?: number
          status?: 'empty' | 'occupied'
          created_at?: string
          updated_at?: string
        }
      }
      products: {
        Row: {
          id: string
          restaurant_id: string
          name: string
          price: number
          is_active: boolean
          stock_quantity: number
          stock_enabled: boolean
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          restaurant_id: string
          name: string
          price: number
          is_active?: boolean
          stock_quantity?: number
          stock_enabled?: boolean
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          restaurant_id?: string
          name?: string
          price?: number
          is_active?: boolean
          stock_quantity?: number
          stock_enabled?: boolean
          created_at?: string
          updated_at?: string
        }
      }
      orders: {
        Row: {
          id: string
          table_id: string
          order_number: number | null
          status: 'open' | 'sent' | 'paid'
          total_price: number
          payment_method: 'cash' | 'credit_card' | 'iban' | null
          created_at: string
          paid_at: string | null
          created_by_type: 'waiter'
          created_by_id: string
          updated_at: string
        }
        Insert: {
          id?: string
          table_id: string
          order_number?: number | null
          status?: 'open' | 'sent' | 'paid'
          total_price?: number
          payment_method?: 'cash' | 'credit_card' | 'iban' | null
          created_at?: string
          paid_at?: string | null
          created_by_type?: 'waiter'
          created_by_id: string
          updated_at?: string
        }
        Update: {
          id?: string
          table_id?: string
          order_number?: number | null
          status?: 'open' | 'sent' | 'paid'
          total_price?: number
          payment_method?: 'cash' | 'credit_card' | 'iban' | null
          created_at?: string
          paid_at?: string | null
          created_by_type?: 'waiter'
          created_by_id?: string
          updated_at?: string
        }
      }
      order_items: {
        Row: {
          id: string
          order_id: string
          product_id: string
          quantity: number
          price: number
          is_sent_to_kitchen: boolean
          sent_at: string | null
          note: string | null
          created_at: string
        }
        Insert: {
          id?: string
          order_id: string
          product_id: string
          quantity: number
          price: number
          is_sent_to_kitchen?: boolean
          sent_at?: string | null
          note?: string | null
          created_at?: string
        }
        Update: {
          id?: string
          order_id?: string
          product_id?: string
          quantity?: number
          price?: number
          is_sent_to_kitchen?: boolean
          sent_at?: string | null
          note?: string | null
          created_at?: string
        }
      }
    }
  }
}
