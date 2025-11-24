-- Drop existing foreign key constraint and recreate with ON DELETE SET NULL
ALTER TABLE public.warden_approvals 
DROP CONSTRAINT IF EXISTS warden_approvals_warden_id_fkey;

ALTER TABLE public.warden_approvals 
ADD CONSTRAINT warden_approvals_warden_id_fkey 
FOREIGN KEY (warden_id) REFERENCES public.user_profiles(id) ON DELETE SET NULL;

-- Same for approved_by
ALTER TABLE public.warden_approvals 
DROP CONSTRAINT IF EXISTS warden_approvals_approved_by_fkey;

ALTER TABLE public.warden_approvals 
ADD CONSTRAINT warden_approvals_approved_by_fkey 
FOREIGN KEY (approved_by) REFERENCES public.user_profiles(id) ON DELETE SET NULL;

-- Same for inventory_items assigned_by
ALTER TABLE public.inventory_items 
DROP CONSTRAINT IF EXISTS inventory_items_assigned_by_fkey;

ALTER TABLE public.inventory_items 
ADD CONSTRAINT inventory_items_assigned_by_fkey 
FOREIGN KEY (assigned_by) REFERENCES public.user_profiles(id) ON DELETE SET NULL;