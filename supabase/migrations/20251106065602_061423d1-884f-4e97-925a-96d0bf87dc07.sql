-- Allow wardens to delete their assigned hostel
CREATE POLICY "Wardens can delete their hostel"
ON public.hostels
FOR DELETE
USING (warden_id = auth.uid());