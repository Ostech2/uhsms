-- Drop existing foreign key constraints and recreate with CASCADE DELETE
-- This allows automatic deletion of related records when a hostel is deleted

-- Fix inventory_items foreign key (note the typo in original: inventory_itms)
ALTER TABLE inventory_items 
DROP CONSTRAINT IF EXISTS inventory_items_hostel_id_fkey;

ALTER TABLE inventory_items
ADD CONSTRAINT inventory_items_hostel_id_fkey 
FOREIGN KEY (hostel_id) 
REFERENCES hostels(id) 
ON DELETE CASCADE;

-- Fix inventory_items room_id foreign key
ALTER TABLE inventory_items
DROP CONSTRAINT IF EXISTS inventory_items_room_id_fkey;

ALTER TABLE inventory_items
ADD CONSTRAINT inventory_items_room_id_fkey
FOREIGN KEY (room_id)
REFERENCES rooms(id)
ON DELETE SET NULL;

-- Fix rooms foreign key
ALTER TABLE rooms
DROP CONSTRAINT IF EXISTS rooms_hostel_id_fkey;

ALTER TABLE rooms
ADD CONSTRAINT rooms_hostel_id_fkey
FOREIGN KEY (hostel_id)
REFERENCES hostels(id)
ON DELETE CASCADE;

-- Fix room_occupants foreign key
ALTER TABLE room_occupants
DROP CONSTRAINT IF EXISTS room_occupants_room_id_fkey;

ALTER TABLE room_occupants
ADD CONSTRAINT room_occupants_room_id_fkey
FOREIGN KEY (room_id)
REFERENCES rooms(id)
ON DELETE CASCADE;