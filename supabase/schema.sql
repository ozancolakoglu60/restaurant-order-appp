-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Restaurants table
CREATE TABLE IF NOT EXISTS public.restaurants (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  code TEXT UNIQUE NOT NULL,
  name TEXT NOT NULL,
  iban TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Users table (extends Supabase auth.users)
CREATE TABLE IF NOT EXISTS public.users (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  role TEXT NOT NULL CHECK (role IN ('admin', 'waiter')),
  restaurant_id UUID NOT NULL REFERENCES public.restaurants(id) ON DELETE CASCADE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Tables
CREATE TABLE IF NOT EXISTS public.tables (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  restaurant_id UUID NOT NULL REFERENCES public.restaurants(id) ON DELETE CASCADE,
  table_number INTEGER NOT NULL,
  status TEXT NOT NULL DEFAULT 'empty' CHECK (status IN ('empty', 'occupied')),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(restaurant_id, table_number)
);

-- Products
CREATE TABLE IF NOT EXISTS public.products (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  restaurant_id UUID NOT NULL REFERENCES public.restaurants(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  price DECIMAL(10, 2) NOT NULL CHECK (price >= 0),
  is_active BOOLEAN NOT NULL DEFAULT true,
  stock_quantity INTEGER NOT NULL DEFAULT 0 CHECK (stock_quantity >= 0),
  stock_enabled BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Orders
CREATE TABLE IF NOT EXISTS public.orders (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  table_id UUID NOT NULL REFERENCES public.tables(id) ON DELETE CASCADE,
  order_number INTEGER,
  status TEXT NOT NULL DEFAULT 'open' CHECK (status IN ('open', 'sent', 'paid')),
  total_price DECIMAL(10, 2) NOT NULL DEFAULT 0 CHECK (total_price >= 0),
  payment_method TEXT CHECK (payment_method IN ('cash', 'credit_card', 'iban')),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  paid_at TIMESTAMP WITH TIME ZONE,
  created_by_type TEXT NOT NULL DEFAULT 'waiter' CHECK (created_by_type = 'waiter'),
  created_by_id UUID NOT NULL REFERENCES public.users(id) ON DELETE RESTRICT,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Order Items
CREATE TABLE IF NOT EXISTS public.order_items (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  order_id UUID NOT NULL REFERENCES public.orders(id) ON DELETE CASCADE,
  product_id UUID NOT NULL REFERENCES public.products(id) ON DELETE RESTRICT,
  quantity INTEGER NOT NULL CHECK (quantity > 0),
  price DECIMAL(10, 2) NOT NULL CHECK (price >= 0),
  is_sent_to_kitchen BOOLEAN NOT NULL DEFAULT false,
  sent_at TIMESTAMP WITH TIME ZONE,
  note TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_restaurants_code ON public.restaurants(code);
CREATE INDEX IF NOT EXISTS idx_users_restaurant_id ON public.users(restaurant_id);
CREATE INDEX IF NOT EXISTS idx_tables_restaurant_id ON public.tables(restaurant_id);
CREATE INDEX IF NOT EXISTS idx_products_restaurant_id ON public.products(restaurant_id);
CREATE INDEX IF NOT EXISTS idx_orders_table_id ON public.orders(table_id);
CREATE INDEX IF NOT EXISTS idx_orders_status ON public.orders(status);
CREATE INDEX IF NOT EXISTS idx_orders_created_by_id ON public.orders(created_by_id);
CREATE INDEX IF NOT EXISTS idx_order_items_order_id ON public.order_items(order_id);
CREATE INDEX IF NOT EXISTS idx_order_items_product_id ON public.order_items(product_id);
CREATE INDEX IF NOT EXISTS idx_products_is_active ON public.products(is_active);

-- Functions
-- Update total_price when order_items change
CREATE OR REPLACE FUNCTION update_order_total()
RETURNS TRIGGER AS $$
BEGIN
  UPDATE public.orders
  SET total_price = (
    SELECT COALESCE(SUM(quantity * price), 0)
    FROM public.order_items
    WHERE order_id = COALESCE(NEW.order_id, OLD.order_id)
  ),
  updated_at = NOW()
  WHERE id = COALESCE(NEW.order_id, OLD.order_id);
  RETURN COALESCE(NEW, OLD);
END;
$$ LANGUAGE plpgsql;

-- Trigger for order_items
DROP TRIGGER IF EXISTS trigger_update_order_total ON public.order_items;
CREATE TRIGGER trigger_update_order_total
  AFTER INSERT OR UPDATE OR DELETE ON public.order_items
  FOR EACH ROW
  EXECUTE FUNCTION update_order_total();

-- Function to update table status
CREATE OR REPLACE FUNCTION update_table_status()
RETURNS TRIGGER AS $$
BEGIN
  -- Handle INSERT (new order created)
  IF OLD IS NULL THEN
    -- New order is created with status 'open' or 'sent', mark table as occupied
    IF NEW.status IN ('open', 'sent') THEN
      UPDATE public.tables
      SET status = 'occupied', updated_at = NOW()
      WHERE id = NEW.table_id;
    END IF;
  -- Handle UPDATE
  ELSIF OLD IS NOT NULL THEN
    -- If order status changed to 'paid', mark table as empty
    IF NEW.status = 'paid' AND OLD.status != 'paid' THEN
      UPDATE public.tables
      SET status = 'empty', updated_at = NOW()
      WHERE id = NEW.table_id;
    -- If order status changed from 'paid' to 'open' or 'sent', mark table as occupied
    ELSIF NEW.status IN ('open', 'sent') AND OLD.status = 'paid' THEN
      UPDATE public.tables
      SET status = 'occupied', updated_at = NOW()
      WHERE id = NEW.table_id;
    -- If order is updated but status is still 'open' or 'sent', ensure table is occupied
    ELSIF NEW.status IN ('open', 'sent') AND OLD.status != 'paid' THEN
      UPDATE public.tables
      SET status = 'occupied', updated_at = NOW()
      WHERE id = NEW.table_id;
    END IF;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger for orders
DROP TRIGGER IF EXISTS trigger_update_table_status ON public.orders;
CREATE TRIGGER trigger_update_table_status
  AFTER INSERT OR UPDATE ON public.orders
  FOR EACH ROW
  EXECUTE FUNCTION update_table_status();

-- Function to auto-generate order_number per restaurant
CREATE OR REPLACE FUNCTION generate_order_number()
RETURNS TRIGGER AS $$
DECLARE
  v_restaurant_id UUID;
  v_max_order_number INTEGER;
BEGIN
  -- Get restaurant_id from the table
  SELECT restaurant_id INTO v_restaurant_id
  FROM public.tables
  WHERE id = NEW.table_id;

  -- If restaurant_id is found, generate order_number
  IF v_restaurant_id IS NOT NULL THEN
    -- Get the maximum order_number for this restaurant
    SELECT COALESCE(MAX(order_number), 0) INTO v_max_order_number
    FROM public.orders o
    INNER JOIN public.tables t ON o.table_id = t.id
    WHERE t.restaurant_id = v_restaurant_id;

    -- Set order_number to max + 1
    NEW.order_number := v_max_order_number + 1;
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger to auto-generate order_number
DROP TRIGGER IF EXISTS trigger_generate_order_number ON public.orders;
CREATE TRIGGER trigger_generate_order_number
  BEFORE INSERT ON public.orders
  FOR EACH ROW
  WHEN (NEW.order_number IS NULL)
  EXECUTE FUNCTION generate_order_number();

-- Function to decrease stock when order item is sent to kitchen
-- SECURITY DEFINER allows this function to bypass RLS policies
CREATE OR REPLACE FUNCTION decrease_product_stock()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  current_stock INTEGER;
  product_stock_enabled BOOLEAN;
  new_stock_quantity INTEGER;
BEGIN
  -- Only process when item is marked as sent to kitchen for the first time
  IF NEW.is_sent_to_kitchen = true AND (OLD IS NULL OR OLD.is_sent_to_kitchen = false) THEN
    -- Get current stock and stock_enabled status
    SELECT stock_quantity, stock_enabled 
    INTO current_stock, product_stock_enabled
    FROM public.products
    WHERE id = NEW.product_id;
    
    -- Only decrease stock if product has stock tracking enabled
    IF product_stock_enabled = true AND current_stock IS NOT NULL THEN
      -- Check if there's enough stock, if yes decrease it
      IF current_stock >= NEW.quantity THEN
        -- Calculate new stock quantity
        new_stock_quantity := current_stock - NEW.quantity;
        
        -- Decrease stock (SECURITY DEFINER allows bypassing RLS)
        UPDATE public.products
        SET stock_quantity = new_stock_quantity,
            updated_at = NOW()
        WHERE id = NEW.product_id
          AND stock_enabled = true;
        
        -- Auto-disable product if stock reaches 0 or below after decrease
        IF new_stock_quantity <= 0 THEN
          UPDATE public.products
          SET is_active = false, updated_at = NOW()
          WHERE id = NEW.product_id
            AND stock_enabled = true;
        END IF;
      END IF;
      -- Note: If stock is insufficient, we don't raise an error here
      -- Client-side validation should prevent this, but if it happens, 
      -- the item will still be marked as sent but stock won't decrease
    END IF;
  END IF;
  RETURN NEW;
END;
$$;

-- Trigger for order_items
DROP TRIGGER IF EXISTS trigger_decrease_stock ON public.order_items;
CREATE TRIGGER trigger_decrease_stock
  AFTER INSERT OR UPDATE ON public.order_items
  FOR EACH ROW
  EXECUTE FUNCTION decrease_product_stock();

-- RLS Policies
ALTER TABLE public.restaurants ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.tables ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.products ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.orders ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.order_items ENABLE ROW LEVEL SECURITY;

-- Restaurants policies
DROP POLICY IF EXISTS "Everyone can view restaurants by code" ON public.restaurants;
CREATE POLICY "Everyone can view restaurants by code" ON public.restaurants
  FOR SELECT USING (true);

-- Function to get user's restaurant_id (security definer to bypass RLS)
CREATE OR REPLACE FUNCTION public.get_user_restaurant_id(user_id UUID)
RETURNS UUID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  rest_id UUID;
BEGIN
  SELECT restaurant_id INTO rest_id
  FROM public.users
  WHERE id = user_id;
  RETURN rest_id;
END;
$$;

-- Function to check if user is admin (security definer to bypass RLS)
CREATE OR REPLACE FUNCTION public.is_admin(user_id UUID)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM public.users
    WHERE id = user_id AND role = 'admin'
  );
END;
$$;

-- Function to check if user is waiter (security definer to bypass RLS)
CREATE OR REPLACE FUNCTION public.is_waiter(user_id UUID)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM public.users
    WHERE id = user_id AND role = 'waiter'
  );
END;
$$;

-- Users policies
DROP POLICY IF EXISTS "Users can view their own profile" ON public.users;
CREATE POLICY "Users can view their own profile" ON public.users
  FOR SELECT USING (auth.uid() = id);

DROP POLICY IF EXISTS "Users can insert their own profile" ON public.users;
CREATE POLICY "Users can insert their own profile" ON public.users
  FOR INSERT WITH CHECK (auth.uid() = id);

DROP POLICY IF EXISTS "Users can update their own profile" ON public.users;
CREATE POLICY "Users can update their own profile" ON public.users
  FOR UPDATE USING (auth.uid() = id);

-- Admin politikası: Security definer function kullanarak sonsuz özyinelemeyi önle
DROP POLICY IF EXISTS "Admins can view all users in their restaurant" ON public.users;
CREATE POLICY "Admins can view all users in their restaurant" ON public.users
  FOR SELECT USING (
    public.is_admin(auth.uid()) AND
    restaurant_id = public.get_user_restaurant_id(auth.uid())
  );

-- Tables policies
DROP POLICY IF EXISTS "Users can view tables in their restaurant" ON public.tables;
CREATE POLICY "Users can view tables in their restaurant" ON public.tables
  FOR SELECT USING (
    restaurant_id = public.get_user_restaurant_id(auth.uid())
  );

DROP POLICY IF EXISTS "Admins can manage tables in their restaurant" ON public.tables;
CREATE POLICY "Admins can manage tables in their restaurant" ON public.tables
  FOR ALL 
  USING (
    public.is_admin(auth.uid()) AND
    restaurant_id = public.get_user_restaurant_id(auth.uid())
  )
  WITH CHECK (
    public.is_admin(auth.uid()) AND
    restaurant_id = public.get_user_restaurant_id(auth.uid())
  );

-- Products policies
DROP POLICY IF EXISTS "Users can view active products in their restaurant" ON public.products;
CREATE POLICY "Users can view active products in their restaurant" ON public.products
  FOR SELECT USING (
    is_active = true AND
    restaurant_id = public.get_user_restaurant_id(auth.uid())
  );

DROP POLICY IF EXISTS "Admins can view all products in their restaurant" ON public.products;
CREATE POLICY "Admins can view all products in their restaurant" ON public.products
  FOR SELECT USING (
    public.is_admin(auth.uid()) AND
    restaurant_id = public.get_user_restaurant_id(auth.uid())
  );

DROP POLICY IF EXISTS "Admins can manage products in their restaurant" ON public.products;
CREATE POLICY "Admins can manage products in their restaurant" ON public.products
  FOR ALL 
  USING (
    public.is_admin(auth.uid()) AND
    restaurant_id = public.get_user_restaurant_id(auth.uid())
  )
  WITH CHECK (
    public.is_admin(auth.uid()) AND
    restaurant_id = public.get_user_restaurant_id(auth.uid())
  );

-- Orders policies
DROP POLICY IF EXISTS "Waiters can view their own orders" ON public.orders;
CREATE POLICY "Waiters can view their own orders" ON public.orders
  FOR SELECT USING (
    created_by_id = auth.uid() AND 
    public.is_waiter(auth.uid()) AND
    EXISTS (
      SELECT 1 FROM public.tables
      WHERE id = orders.table_id
        AND restaurant_id = public.get_user_restaurant_id(auth.uid())
    )
  );

DROP POLICY IF EXISTS "Admins can view all orders in their restaurant" ON public.orders;
CREATE POLICY "Admins can view all orders in their restaurant" ON public.orders
  FOR SELECT USING (
    public.is_admin(auth.uid()) AND
    EXISTS (
      SELECT 1 FROM public.tables
      WHERE id = orders.table_id
        AND restaurant_id = public.get_user_restaurant_id(auth.uid())
    )
  );

DROP POLICY IF EXISTS "Waiters can create orders" ON public.orders;
CREATE POLICY "Waiters can create orders" ON public.orders
  FOR INSERT WITH CHECK (
    created_by_id = auth.uid() AND 
    public.is_waiter(auth.uid()) AND
    EXISTS (
      SELECT 1 FROM public.tables
      WHERE id = orders.table_id
        AND restaurant_id = public.get_user_restaurant_id(auth.uid())
    )
  );

DROP POLICY IF EXISTS "Waiters can update their own unpaid orders" ON public.orders;
CREATE POLICY "Waiters can update their own unpaid orders" ON public.orders
  FOR UPDATE USING (
    created_by_id = auth.uid() AND
    status != 'paid' AND
    public.is_waiter(auth.uid()) AND
    EXISTS (
      SELECT 1 FROM public.tables
      WHERE id = orders.table_id
        AND restaurant_id = public.get_user_restaurant_id(auth.uid())
    )
  );

DROP POLICY IF EXISTS "Admins can update all orders in their restaurant" ON public.orders;
CREATE POLICY "Admins can update all orders in their restaurant" ON public.orders
  FOR UPDATE USING (
    public.is_admin(auth.uid()) AND
    EXISTS (
      SELECT 1 FROM public.tables
      WHERE id = orders.table_id
        AND restaurant_id = public.get_user_restaurant_id(auth.uid())
    )
  );

-- Order items policies
DROP POLICY IF EXISTS "Waiters can view items of their orders" ON public.order_items;
CREATE POLICY "Waiters can view items of their orders" ON public.order_items
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM public.orders
      JOIN public.tables ON tables.id = orders.table_id
      WHERE orders.id = order_items.order_id
        AND orders.created_by_id = auth.uid()
        AND public.is_waiter(auth.uid())
        AND tables.restaurant_id = public.get_user_restaurant_id(auth.uid())
    )
  );

DROP POLICY IF EXISTS "Admins can view all order items in their restaurant" ON public.order_items;
CREATE POLICY "Admins can view all order items in their restaurant" ON public.order_items
  FOR SELECT USING (
    public.is_admin(auth.uid()) AND
    EXISTS (
      SELECT 1 FROM public.orders
      JOIN public.tables ON tables.id = orders.table_id
      WHERE orders.id = order_items.order_id
        AND tables.restaurant_id = public.get_user_restaurant_id(auth.uid())
    )
  );

DROP POLICY IF EXISTS "Waiters can manage items of their unpaid orders" ON public.order_items;
CREATE POLICY "Waiters can manage items of their unpaid orders" ON public.order_items
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM public.orders
      JOIN public.tables ON tables.id = orders.table_id
      WHERE orders.id = order_items.order_id
        AND orders.created_by_id = auth.uid()
        AND orders.status != 'paid'
        AND public.is_waiter(auth.uid())
        AND tables.restaurant_id = public.get_user_restaurant_id(auth.uid())
    )
  );

DROP POLICY IF EXISTS "Admins can manage all order items in their restaurant" ON public.order_items;
CREATE POLICY "Admins can manage all order items in their restaurant" ON public.order_items
  FOR ALL USING (
    public.is_admin(auth.uid()) AND
    EXISTS (
      SELECT 1 FROM public.orders
      JOIN public.tables ON tables.id = orders.table_id
      WHERE orders.id = order_items.order_id
        AND tables.restaurant_id = public.get_user_restaurant_id(auth.uid())
    )
  );
