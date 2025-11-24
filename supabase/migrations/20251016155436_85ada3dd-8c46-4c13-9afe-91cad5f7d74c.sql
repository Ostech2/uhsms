-- Fix RLS policies for hostels, rooms, and inventory tables
-- This migration addresses critical security vulnerabilities by implementing proper role-based access control

-- ==========================================
-- FIX HOSTELS TABLE POLICIES
-- ==========================================
DROP POLICY IF EXISTS "Anyone can view hostels" ON public.hostels;
DROP POLICY IF EXISTS "Authenticated users can manage hostels" ON public.hostels;

-- Admins can manage all hostels
CREATE POLICY "Admins can manage all hostels"
ON public.hostels FOR ALL
TO authenticated
USING (public.has_role(auth.uid(), 'admin'))
WITH CHECK (public.has_role(auth.uid(), 'admin'));

-- Wardens can view only their assigned hostel
CREATE POLICY "Wardens can view their assigned hostel"
ON public.hostels FOR SELECT
TO authenticated
USING (warden_id = auth.uid());

-- ==========================================
-- FIX ROOMS TABLE POLICIES
-- ==========================================
DROP POLICY IF EXISTS "Anyone can view rooms" ON public.rooms;
DROP POLICY IF EXISTS "Authenticated users can manage rooms" ON public.rooms;

-- Admins can manage all rooms
CREATE POLICY "Admins can manage all rooms"
ON public.rooms FOR ALL
TO authenticated
USING (public.has_role(auth.uid(), 'admin'))
WITH CHECK (public.has_role(auth.uid(), 'admin'));

-- Wardens can view rooms in their assigned hostel
CREATE POLICY "Wardens can view rooms in their hostel"
ON public.rooms FOR SELECT
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM public.hostels
    WHERE hostels.id = rooms.hostel_id
    AND hostels.warden_id = auth.uid()
  )
);

-- ==========================================
-- FIX INVENTORY_CATEGORIES TABLE POLICIES
-- ==========================================
DROP POLICY IF EXISTS "Anyone can view inventory categories" ON public.inventory_categories;
DROP POLICY IF EXISTS "Authenticated users can manage inventory categories" ON public.inventory_categories;

-- All authenticated users can view categories (needed for dropdowns)
CREATE POLICY "Authenticated users can view categories"
ON public.inventory_categories FOR SELECT
TO authenticated
USING (true);

-- Only admins can manage categories
CREATE POLICY "Admins can manage categories"
ON public.inventory_categories FOR ALL
TO authenticated
USING (public.has_role(auth.uid(), 'admin'))
WITH CHECK (public.has_role(auth.uid(), 'admin'));

-- ==========================================
-- FIX INVENTORY_ITEMS TABLE POLICIES
-- ==========================================
DROP POLICY IF EXISTS "Anyone can view inventory items" ON public.inventory_items;
DROP POLICY IF EXISTS "Authenticated users can manage inventory items" ON public.inventory_items;

-- Admins can manage all inventory
CREATE POLICY "Admins can manage all inventory"
ON public.inventory_items FOR ALL
TO authenticated
USING (public.has_role(auth.uid(), 'admin'))
WITH CHECK (public.has_role(auth.uid(), 'admin'));

-- Wardens can view inventory in their assigned hostel
CREATE POLICY "Wardens can view inventory in their hostel"
ON public.inventory_items FOR SELECT
TO authenticated
USING (
  hostel_id IN (
    SELECT id FROM public.hostels
    WHERE warden_id = auth.uid()
  )
);