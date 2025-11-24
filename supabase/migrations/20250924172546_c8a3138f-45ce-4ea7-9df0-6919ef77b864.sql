-- Create hostels table
CREATE TABLE public.hostels (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  type TEXT NOT NULL CHECK (type IN ('male', 'female', 'mixed')),
  total_rooms INTEGER NOT NULL DEFAULT 0,
  warden_id UUID,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create rooms table
CREATE TABLE public.rooms (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  hostel_id UUID NOT NULL REFERENCES public.hostels(id) ON DELETE CASCADE,
  room_number TEXT NOT NULL,
  capacity INTEGER NOT NULL DEFAULT 1,
  current_occupants INTEGER NOT NULL DEFAULT 0,
  status TEXT NOT NULL DEFAULT 'available' CHECK (status IN ('available', 'occupied', 'maintenance', 'closed')),
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(hostel_id, room_number)
);

-- Create inventory categories table
CREATE TABLE public.inventory_categories (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL UNIQUE,
  description TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create inventory items table
CREATE TABLE public.inventory_items (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  category_id UUID NOT NULL REFERENCES public.inventory_categories(id),
  hostel_id UUID REFERENCES public.hostels(id),
  room_id UUID REFERENCES public.rooms(id),
  quantity INTEGER NOT NULL DEFAULT 1,
  condition TEXT NOT NULL DEFAULT 'good' CHECK (condition IN ('excellent', 'good', 'fair', 'poor', 'damaged')),
  status TEXT NOT NULL DEFAULT 'available' CHECK (status IN ('available', 'assigned', 'maintenance', 'damaged', 'disposed')),
  purchase_date DATE,
  last_maintenance DATE,
  notes TEXT,
  assigned_by UUID,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable Row Level Security
ALTER TABLE public.hostels ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.rooms ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.inventory_categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.inventory_items ENABLE ROW LEVEL SECURITY;

-- Create policies for hostels
CREATE POLICY "Anyone can view hostels" 
ON public.hostels 
FOR SELECT 
USING (true);

CREATE POLICY "Authenticated users can manage hostels" 
ON public.hostels 
FOR ALL 
USING (true);

-- Create policies for rooms
CREATE POLICY "Anyone can view rooms" 
ON public.rooms 
FOR SELECT 
USING (true);

CREATE POLICY "Authenticated users can manage rooms" 
ON public.rooms 
FOR ALL 
USING (true);

-- Create policies for inventory categories
CREATE POLICY "Anyone can view inventory categories" 
ON public.inventory_categories 
FOR SELECT 
USING (true);

CREATE POLICY "Authenticated users can manage inventory categories" 
ON public.inventory_categories 
FOR ALL 
USING (true);

-- Create policies for inventory items
CREATE POLICY "Anyone can view inventory items" 
ON public.inventory_items 
FOR SELECT 
USING (true);

CREATE POLICY "Authenticated users can manage inventory items" 
ON public.inventory_items 
FOR ALL 
USING (true);

-- Insert default inventory categories
INSERT INTO public.inventory_categories (name, description) VALUES
('Furniture', 'Beds, desks, chairs, wardrobes'),
('Bedding', 'Mattresses, blankets, pillows, sheets'),
('Electronics', 'Fans, lights, switches, sockets'),
('Maintenance', 'Tools, cleaning supplies, repair items'),
('Kitchen', 'Utensils, appliances, cookware'),
('Safety', 'Fire extinguishers, first aid kits, security items');

-- Create function to update timestamps
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SET search_path = public;

-- Create triggers for automatic timestamp updates
CREATE TRIGGER update_hostels_updated_at
BEFORE UPDATE ON public.hostels
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_rooms_updated_at
BEFORE UPDATE ON public.rooms
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_inventory_items_updated_at
BEFORE UPDATE ON public.inventory_items
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();