-- Create users profiles table
CREATE TABLE public.user_profiles (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  email TEXT NOT NULL UNIQUE,
  full_name TEXT NOT NULL,
  role TEXT NOT NULL CHECK (role IN ('admin', 'male-warden', 'female-warden')),
  assigned_hostel TEXT,
  status TEXT NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'inactive', 'suspended')),
  last_login TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS on user_profiles
ALTER TABLE public.user_profiles ENABLE ROW LEVEL SECURITY;

-- Create policies for user_profiles
CREATE POLICY "Anyone can view user profiles" 
ON public.user_profiles 
FOR SELECT 
USING (true);

CREATE POLICY "Authenticated users can manage user profiles" 
ON public.user_profiles 
FOR ALL 
USING (true);

-- Create approvals table for warden requests
CREATE TABLE public.warden_approvals (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  warden_id UUID REFERENCES public.user_profiles(id),
  request_type TEXT NOT NULL CHECK (request_type IN ('inventory_add', 'maintenance_request', 'room_assignment', 'other')),
  item_details JSONB,
  description TEXT,
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'rejected')),
  approved_by UUID REFERENCES public.user_profiles(id),
  request_date TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  approval_date TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS on warden_approvals
ALTER TABLE public.warden_approvals ENABLE ROW LEVEL SECURITY;

-- Create policies for warden_approvals
CREATE POLICY "Anyone can view approvals" 
ON public.warden_approvals 
FOR SELECT 
USING (true);

CREATE POLICY "Authenticated users can manage approvals" 
ON public.warden_approvals 
FOR ALL 
USING (true);

-- Insert some sample inventory categories if they don't exist
INSERT INTO public.inventory_categories (name, description) VALUES
('Furniture', 'Beds, desks, chairs, wardrobes'),
('Bedding', 'Mattresses, pillows, blankets, sheets'),
('Electronics', 'Fans, lights, electrical appliances'),
('Cleaning', 'Cleaning supplies and equipment'),
('Maintenance', 'Tools and maintenance equipment')
ON CONFLICT DO NOTHING;

-- Insert sample user profiles
INSERT INTO public.user_profiles (email, full_name, role, assigned_hostel, status) VALUES
('admin@hostel.com', 'System Administrator', 'admin', NULL, 'active'),
('sarah@hostel.com', 'Sarah Johnson', 'female-warden', 'Block B', 'active'),
('michael@hostel.com', 'Michael Brown', 'male-warden', 'Block A', 'active'),
('david@hostel.com', 'David Wilson', 'male-warden', 'Block C', 'active')
ON CONFLICT (email) DO NOTHING;

-- Add trigger for updating updated_at
CREATE TRIGGER update_user_profiles_updated_at
BEFORE UPDATE ON public.user_profiles
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_warden_approvals_updated_at
BEFORE UPDATE ON public.warden_approvals
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();