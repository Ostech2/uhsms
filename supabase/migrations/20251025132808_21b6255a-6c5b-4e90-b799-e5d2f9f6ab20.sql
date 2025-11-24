-- Create room_occupants table to store student details
CREATE TABLE public.room_occupants (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  room_id UUID NOT NULL REFERENCES public.rooms(id) ON DELETE CASCADE,
  student_name TEXT NOT NULL,
  registration_number TEXT NOT NULL,
  access_number TEXT NOT NULL,
  year_of_study INTEGER NOT NULL,
  semester INTEGER NOT NULL,
  check_in_date TIMESTAMP WITH TIME ZONE DEFAULT now(),
  check_out_date TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.room_occupants ENABLE ROW LEVEL SECURITY;

-- Admins can manage all occupants
CREATE POLICY "Admins can manage all occupants"
ON public.room_occupants
FOR ALL
USING (has_role(auth.uid(), 'admin'::app_role))
WITH CHECK (has_role(auth.uid(), 'admin'::app_role));

-- Wardens can view occupants in their hostel rooms
CREATE POLICY "Wardens can view occupants in their hostel"
ON public.room_occupants
FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM public.rooms r
    JOIN public.hostels h ON r.hostel_id = h.id
    WHERE r.id = room_occupants.room_id
    AND h.warden_id = auth.uid()
  )
);

-- Wardens can add occupants to their hostel rooms
CREATE POLICY "Wardens can add occupants to their hostel"
ON public.room_occupants
FOR INSERT
WITH CHECK (
  EXISTS (
    SELECT 1 FROM public.rooms r
    JOIN public.hostels h ON r.hostel_id = h.id
    WHERE r.id = room_occupants.room_id
    AND h.warden_id = auth.uid()
  )
);

-- Wardens can update occupants in their hostel rooms
CREATE POLICY "Wardens can update occupants in their hostel"
ON public.room_occupants
FOR UPDATE
USING (
  EXISTS (
    SELECT 1 FROM public.rooms r
    JOIN public.hostels h ON r.hostel_id = h.id
    WHERE r.id = room_occupants.room_id
    AND h.warden_id = auth.uid()
  )
);

-- Wardens can delete occupants from their hostel rooms
CREATE POLICY "Wardens can delete occupants from their hostel"
ON public.room_occupants
FOR DELETE
USING (
  EXISTS (
    SELECT 1 FROM public.rooms r
    JOIN public.hostels h ON r.hostel_id = h.id
    WHERE r.id = room_occupants.room_id
    AND h.warden_id = auth.uid()
  )
);

-- Create trigger for updated_at
CREATE TRIGGER update_room_occupants_updated_at
BEFORE UPDATE ON public.room_occupants
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

-- Create index for faster lookups
CREATE INDEX idx_room_occupants_room_id ON public.room_occupants(room_id);