-- Create function to update room occupancy count
CREATE OR REPLACE FUNCTION update_room_occupancy()
RETURNS TRIGGER AS $$
BEGIN
  IF (TG_OP = 'INSERT') THEN
    -- Increment current_occupants when a new occupant is added
    UPDATE rooms
    SET current_occupants = current_occupants + 1,
        status = CASE 
          WHEN current_occupants + 1 >= capacity THEN 'occupied'
          ELSE 'available'
        END
    WHERE id = NEW.room_id;
    RETURN NEW;
  ELSIF (TG_OP = 'DELETE') THEN
    -- Decrement current_occupants when an occupant is removed
    UPDATE rooms
    SET current_occupants = GREATEST(current_occupants - 1, 0),
        status = CASE 
          WHEN current_occupants - 1 <= 0 THEN 'available'
          WHEN current_occupants - 1 >= capacity THEN 'occupied'
          ELSE 'available'
        END
    WHERE id = OLD.room_id;
    RETURN OLD;
  END IF;
  RETURN NULL;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

-- Create trigger on room_occupants table
DROP TRIGGER IF EXISTS trigger_update_room_occupancy ON room_occupants;
CREATE TRIGGER trigger_update_room_occupancy
AFTER INSERT OR DELETE ON room_occupants
FOR EACH ROW
EXECUTE FUNCTION update_room_occupancy();

-- Recalculate current occupants for all existing rooms
UPDATE rooms r
SET current_occupants = (
  SELECT COUNT(*)
  FROM room_occupants ro
  WHERE ro.room_id = r.id
    AND ro.check_out_date IS NULL
);

-- Update room status based on current occupancy
UPDATE rooms
SET status = CASE
  WHEN current_occupants >= capacity THEN 'occupied'
  WHEN current_occupants > 0 THEN 'available'
  ELSE 'available'
END;