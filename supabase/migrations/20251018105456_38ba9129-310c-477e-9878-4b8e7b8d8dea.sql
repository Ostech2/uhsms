-- Allow wardens to insert hostels
CREATE POLICY "Wardens can create hostels"
ON public.hostels
FOR INSERT
TO authenticated
WITH CHECK (
  EXISTS (
    SELECT 1 FROM public.user_profiles
    WHERE id = auth.uid() 
    AND (role = 'male-warden' OR role = 'female-warden')
    AND status = 'active'
  )
);

-- Allow wardens to update their assigned hostels
CREATE POLICY "Wardens can update their hostel"
ON public.hostels
FOR UPDATE
TO authenticated
USING (warden_id = auth.uid())
WITH CHECK (warden_id = auth.uid());

-- Allow wardens to insert rooms in any hostel
CREATE POLICY "Wardens can create rooms"
ON public.rooms
FOR INSERT
TO authenticated
WITH CHECK (
  EXISTS (
    SELECT 1 FROM public.user_profiles
    WHERE id = auth.uid() 
    AND (role = 'male-warden' OR role = 'female-warden')
    AND status = 'active'
  )
);

-- Allow wardens to update rooms in their hostels
CREATE POLICY "Wardens can update rooms in their hostel"
ON public.rooms
FOR UPDATE
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM public.hostels
    WHERE hostels.id = rooms.hostel_id 
    AND hostels.warden_id = auth.uid()
  )
);

-- Allow wardens to insert inventory items
CREATE POLICY "Wardens can create inventory"
ON public.inventory_items
FOR INSERT
TO authenticated
WITH CHECK (
  EXISTS (
    SELECT 1 FROM public.user_profiles
    WHERE id = auth.uid() 
    AND (role = 'male-warden' OR role = 'female-warden')
    AND status = 'active'
  )
);

-- Allow wardens to update inventory in their hostels
CREATE POLICY "Wardens can update inventory in their hostel"
ON public.inventory_items
FOR UPDATE
TO authenticated
USING (
  hostel_id IN (
    SELECT id FROM public.hostels
    WHERE warden_id = auth.uid()
  )
);