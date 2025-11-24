import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "@/components/ui/alert-dialog";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Building, Plus, Edit, Bed, Package, Users, Trash2 } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";

interface Hostel {
  id: string;
  name: string;
  type: string;
  total_rooms: number;
  warden_id?: string;
}

interface Room {
  id: string;
  hostel_id: string;
  room_number: string;
  capacity: number;
  current_occupants: number;
  status: string;
}

interface InventoryItem {
  id: string;
  name: string;
  category_id: string;
  hostel_id?: string;
  room_id?: string;
  quantity: number;
  condition: string;
  status: string;
  notes?: string;
}

interface RoomOccupant {
  id: string;
  room_id: string;
  student_name: string;
  registration_number: string;
  access_number: string;
  year_of_study: number;
  semester: number;
  check_in_date?: string;
  check_out_date?: string;
}

interface HostelManagementProps {
  wardenType: 'male' | 'female' | 'admin';
}

export function HostelManagement({ wardenType }: HostelManagementProps) {
  const [hostels, setHostels] = useState<Hostel[]>([]);
  const [rooms, setRooms] = useState<Room[]>([]);
  const [inventoryItems, setInventoryItems] = useState<InventoryItem[]>([]);
  const [categories, setCategories] = useState<any[]>([]);
  const [occupants, setOccupants] = useState<RoomOccupant[]>([]);
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();

  // Form states
  const [newHostel, setNewHostel] = useState({ name: '', type: 'male', total_rooms: 0 });
  const [newRoom, setNewRoom] = useState({ hostel_id: '', room_number: '', capacity: 1 });
  const [newItem, setNewItem] = useState({ 
    name: '', 
    category_id: '', 
    hostel_id: '', 
    room_id: '', 
    quantity: 1, 
    condition: 'good',
    notes: ''
  });
  const [newOccupant, setNewOccupant] = useState({
    room_id: '',
    student_name: '',
    registration_number: '',
    access_number: '',
    year_of_study: 1,
    semester: 1
  });

  const [isHostelDialogOpen, setIsHostelDialogOpen] = useState(false);
  const [isRoomDialogOpen, setIsRoomDialogOpen] = useState(false);
  const [isItemDialogOpen, setIsItemDialogOpen] = useState(false);
  const [isOccupantDialogOpen, setIsOccupantDialogOpen] = useState(false);

  // Load data
  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      setLoading(true);
      
      // Load hostels (filter by type for wardens)
      let hostelQuery = supabase.from('hostels').select('*');
      if (wardenType !== 'admin') {
        hostelQuery = hostelQuery.eq('type', wardenType);
      }
      const { data: hostelsData } = await hostelQuery;

      // Load rooms
      const { data: roomsData } = await supabase.from('rooms').select('*');

      // Load inventory items
      const { data: itemsData } = await supabase.from('inventory_items').select('*');

      // Load categories
      const { data: categoriesData } = await supabase.from('inventory_categories').select('*');

      // Load room occupants
      const { data: occupantsData } = await supabase.from('room_occupants').select('*');

      setHostels(hostelsData || []);
      setRooms(roomsData || []);
      setInventoryItems(itemsData || []);
      setCategories(categoriesData || []);
      setOccupants(occupantsData || []);
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to load data",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const addHostel = async () => {
    try {
      // Get current user to set as warden
      const { data: { user } } = await supabase.auth.getUser();
      
      if (!user) {
        toast({
          title: "Error",
          description: "You must be logged in to add hostels.",
          variant: "destructive",
        });
        return;
      }

      const { error } = await supabase
        .from('hostels')
        .insert([{
          ...newHostel,
          warden_id: user.id
        }]);

      if (error) throw error;

      toast({
        title: "Success",
        description: "Hostel added successfully",
      });

      setNewHostel({ name: '', type: 'male', total_rooms: 0 });
      setIsHostelDialogOpen(false);
      loadData();
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to add hostel",
        variant: "destructive",
      });
    }
  };

  const addRoom = async () => {
    try {
      const { error } = await supabase
        .from('rooms')
        .insert([newRoom]);

      if (error) throw error;

      toast({
        title: "Success",
        description: "Room added successfully",
      });

      setNewRoom({ hostel_id: '', room_number: '', capacity: 1 });
      setIsRoomDialogOpen(false);
      loadData();
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to add room",
        variant: "destructive",
      });
    }
  };

  const addInventoryItem = async () => {
    try {
      // Get current user (warden or admin)
      const { data: { user } } = await supabase.auth.getUser();
      
      if (!user) {
        toast({
          title: "Error",
          description: "You must be logged in to add items.",
          variant: "destructive",
        });
        return;
      }

      // Prepare item data, converting empty strings to null for UUID fields
      const itemData = {
        name: newItem.name,
        category_id: newItem.category_id || null,
        hostel_id: newItem.hostel_id || null,
        room_id: newItem.room_id || null,
        quantity: newItem.quantity,
        condition: newItem.condition,
        status: 'available',
        notes: newItem.notes || null,
        assigned_by: user.id
      };

      // Add item directly to database for both wardens and admins
      const { error } = await supabase
        .from('inventory_items')
        .insert([itemData]);

      if (error) throw error;

      toast({
        title: "Success",
        description: "Inventory item added successfully",
      });

      setNewItem({ 
        name: '', 
        category_id: '', 
        hostel_id: '', 
        room_id: '', 
        quantity: 1, 
        condition: 'good',
        notes: ''
      });
      setIsItemDialogOpen(false);
      loadData();
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to add inventory item",
        variant: "destructive",
      });
    }
  };

  const addOccupant = async () => {
    try {
      // Check if registration number already exists
      const { data: existingOccupants, error: checkError } = await supabase
        .from('room_occupants')
        .select('id')
        .eq('registration_number', newOccupant.registration_number)
        .is('check_out_date', null);

      if (checkError) throw checkError;

      if (existingOccupants && existingOccupants.length > 0) {
        toast({
          title: "Error",
          description: "This registration number is already registered. Each registration number can only be used once.",
          variant: "destructive",
        });
        return;
      }

      const { error } = await supabase
        .from('room_occupants')
        .insert([newOccupant]);

      if (error) {
        // Check if it's a unique constraint violation
        if (error.message.includes('duplicate') || error.code === '23505') {
          toast({
            title: "Error",
            description: "This registration number or access number is already registered in the system.",
            variant: "destructive",
          });
          return;
        }
        throw error;
      }

      toast({
        title: "Success",
        description: "Student added to room successfully",
      });

      setNewOccupant({
        room_id: '',
        student_name: '',
        registration_number: '',
        access_number: '',
        year_of_study: 1,
        semester: 1
      });
      setIsOccupantDialogOpen(false);
      loadData();
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to add student",
        variant: "destructive",
      });
    }
  };

  const deleteOccupant = async (occupantId: string, studentName: string) => {
    try {
      const { error } = await supabase
        .from('room_occupants')
        .delete()
        .eq('id', occupantId);

      if (error) throw error;

      toast({
        title: "Success",
        description: `${studentName} has been removed from the room.`,
      });

      loadData();
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to delete student",
        variant: "destructive",
      });
    }
  };

  const deleteHostel = async (hostelId: string, hostelName: string) => {
    try {
      const { error } = await supabase
        .from('hostels')
        .delete()
        .eq('id', hostelId);

      if (error) throw error;

      toast({
        title: "Success",
        description: `${hostelName} has been deleted.`,
      });

      loadData();
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || "Failed to delete hostel",
        variant: "destructive",
      });
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'available': return 'bg-green-500';
      case 'occupied': return 'bg-blue-500';
      case 'maintenance': return 'bg-yellow-500';
      case 'closed': return 'bg-red-500';
      case 'assigned': return 'bg-blue-500';
      case 'damaged': return 'bg-red-500';
      default: return 'bg-gray-500';
    }
  };

  if (loading) {
    return <div className="flex justify-center p-8">Loading...</div>;
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold">Hostel Management</h2>
        <div className="text-sm text-muted-foreground">
          Uganda Christian University - Bishop Barham University College Kabale
        </div>
      </div>

      <Tabs defaultValue="hostels" className="space-y-4">
        <TabsList>
          <TabsTrigger value="hostels" className="flex items-center gap-2">
            <Building size={16} />
            Hostels
          </TabsTrigger>
          <TabsTrigger value="rooms" className="flex items-center gap-2">
            <Bed size={16} />
            Rooms
          </TabsTrigger>
          <TabsTrigger value="occupants" className="flex items-center gap-2">
            <Users size={16} />
            Occupants
          </TabsTrigger>
          <TabsTrigger value="inventory" className="flex items-center gap-2">
            <Package size={16} />
            Inventory
          </TabsTrigger>
        </TabsList>

        <TabsContent value="hostels" className="space-y-4">
          <Card>
            <CardHeader>
              <div className="flex justify-between items-center">
                <div>
                  <CardTitle>Hostels</CardTitle>
                  <CardDescription>Manage hostel information and assignments</CardDescription>
                </div>
                <Dialog open={isHostelDialogOpen} onOpenChange={setIsHostelDialogOpen}>
                  <DialogTrigger asChild>
                    <Button>
                      <Plus className="mr-2 h-4 w-4" />
                      Add Hostel
                    </Button>
                  </DialogTrigger>
                  <DialogContent>
                    <DialogHeader>
                      <DialogTitle>Add New Hostel</DialogTitle>
                      <DialogDescription>Create a new hostel entry</DialogDescription>
                    </DialogHeader>
                    <div className="space-y-4">
                      <div>
                        <Label htmlFor="hostel-name">Hostel Name</Label>
                        <Input
                          id="hostel-name"
                          value={newHostel.name}
                          onChange={(e) => setNewHostel({ ...newHostel, name: e.target.value })}
                          placeholder="Enter hostel name"
                        />
                      </div>
                      <div>
                        <Label htmlFor="hostel-type">Type</Label>
                        <Select value={newHostel.type} onValueChange={(value) => setNewHostel({ ...newHostel, type: value })}>
                          <SelectTrigger>
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="male">Male</SelectItem>
                            <SelectItem value="female">Female</SelectItem>
                            <SelectItem value="mixed">Mixed</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                      <div>
                        <Label htmlFor="total-rooms">Total Rooms</Label>
                        <Input
                          id="total-rooms"
                          type="number"
                          value={newHostel.total_rooms}
                          onChange={(e) => setNewHostel({ ...newHostel, total_rooms: parseInt(e.target.value) || 0 })}
                        />
                      </div>
                    </div>
                    <DialogFooter>
                      <Button onClick={addHostel}>Add Hostel</Button>
                    </DialogFooter>
                  </DialogContent>
                </Dialog>
              </div>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Name</TableHead>
                    <TableHead>Type</TableHead>
                    <TableHead>Total Rooms</TableHead>
                    <TableHead>Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {hostels.map((hostel) => (
                    <TableRow key={hostel.id}>
                      <TableCell className="font-medium">{hostel.name}</TableCell>
                      <TableCell>
                        <Badge variant="secondary">{hostel.type}</Badge>
                      </TableCell>
                      <TableCell>{hostel.total_rooms}</TableCell>
                        <TableCell>
                          <div className="flex gap-2">
                            <Button variant="outline" size="sm">
                              <Edit className="h-4 w-4" />
                            </Button>
                            <AlertDialog>
                              <AlertDialogTrigger asChild>
                                <Button variant="outline" size="sm">
                                  <Trash2 className="h-4 w-4 text-destructive" />
                                </Button>
                              </AlertDialogTrigger>
                              <AlertDialogContent>
                                <AlertDialogHeader>
                                  <AlertDialogTitle>Delete Hostel?</AlertDialogTitle>
                                  <AlertDialogDescription>
                                    Are you sure you want to delete <strong>{hostel.name}</strong>? This will also delete all rooms and occupants associated with this hostel. This action cannot be undone.
                                  </AlertDialogDescription>
                                </AlertDialogHeader>
                                <AlertDialogFooter>
                                  <AlertDialogCancel>Cancel</AlertDialogCancel>
                                  <AlertDialogAction
                                    onClick={() => deleteHostel(hostel.id, hostel.name)}
                                    className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                                  >
                                    Delete
                                  </AlertDialogAction>
                                </AlertDialogFooter>
                              </AlertDialogContent>
                            </AlertDialog>
                          </div>
                        </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="rooms" className="space-y-4">
          <Card>
            <CardHeader>
              <div className="flex justify-between items-center">
                <div>
                  <CardTitle>Rooms</CardTitle>
                  <CardDescription>Manage room assignments and occupancy</CardDescription>
                </div>
                <Dialog open={isRoomDialogOpen} onOpenChange={setIsRoomDialogOpen}>
                  <DialogTrigger asChild>
                    <Button>
                      <Plus className="mr-2 h-4 w-4" />
                      Add Room
                    </Button>
                  </DialogTrigger>
                  <DialogContent>
                    <DialogHeader>
                      <DialogTitle>Add New Room</DialogTitle>
                      <DialogDescription>Create a new room entry</DialogDescription>
                    </DialogHeader>
                    <div className="space-y-4">
                      <div>
                        <Label htmlFor="room-hostel">Hostel</Label>
                        <Select value={newRoom.hostel_id} onValueChange={(value) => setNewRoom({ ...newRoom, hostel_id: value })}>
                          <SelectTrigger>
                            <SelectValue placeholder="Select hostel" />
                          </SelectTrigger>
                          <SelectContent>
                            {hostels.map((hostel) => (
                              <SelectItem key={hostel.id} value={hostel.id}>
                                {hostel.name}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>
                      <div>
                        <Label htmlFor="room-number">Room Number</Label>
                        <Input
                          id="room-number"
                          value={newRoom.room_number}
                          onChange={(e) => setNewRoom({ ...newRoom, room_number: e.target.value })}
                          placeholder="Enter room number"
                        />
                      </div>
                      <div>
                        <Label htmlFor="room-capacity">Capacity</Label>
                        <Input
                          id="room-capacity"
                          type="number"
                          value={newRoom.capacity}
                          onChange={(e) => setNewRoom({ ...newRoom, capacity: parseInt(e.target.value) || 1 })}
                        />
                      </div>
                    </div>
                    <DialogFooter>
                      <Button onClick={addRoom}>Add Room</Button>
                    </DialogFooter>
                  </DialogContent>
                </Dialog>
              </div>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Room Number</TableHead>
                    <TableHead>Hostel</TableHead>
                    <TableHead>Capacity</TableHead>
                    <TableHead>Occupants</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {rooms.map((room) => {
                    const hostel = hostels.find(h => h.id === room.hostel_id);
                    return (
                      <TableRow key={room.id}>
                        <TableCell className="font-medium">{room.room_number}</TableCell>
                        <TableCell>{hostel?.name}</TableCell>
                        <TableCell>{room.capacity}</TableCell>
                        <TableCell>{room.current_occupants}</TableCell>
                        <TableCell>
                          <Badge className={getStatusColor(room.status)}>{room.status}</Badge>
                        </TableCell>
                        <TableCell>
                          <Button variant="outline" size="sm">
                            <Edit className="h-4 w-4" />
                          </Button>
                        </TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="occupants" className="space-y-4">
          <Card>
            <CardHeader>
              <div className="flex justify-between items-center">
                <div>
                  <CardTitle>Room Occupants</CardTitle>
                  <CardDescription>Manage student room assignments</CardDescription>
                </div>
                <Dialog open={isOccupantDialogOpen} onOpenChange={setIsOccupantDialogOpen}>
                  <DialogTrigger asChild>
                    <Button>
                      <Plus className="mr-2 h-4 w-4" />
                      Add Student
                    </Button>
                  </DialogTrigger>
                  <DialogContent>
                    <DialogHeader>
                      <DialogTitle>Add Student to Room</DialogTitle>
                      <DialogDescription>Assign a student to a room</DialogDescription>
                    </DialogHeader>
                    <div className="space-y-4">
                      <div>
                        <Label htmlFor="occupant-room">Room</Label>
                        <Select value={newOccupant.room_id} onValueChange={(value) => setNewOccupant({ ...newOccupant, room_id: value })}>
                          <SelectTrigger>
                            <SelectValue placeholder="Select room" />
                          </SelectTrigger>
                          <SelectContent>
                            {rooms.map((room) => {
                              const hostel = hostels.find(h => h.id === room.hostel_id);
                              return (
                                <SelectItem key={room.id} value={room.id}>
                                  {hostel?.name} - Room {room.room_number}
                                </SelectItem>
                              );
                            })}
                          </SelectContent>
                        </Select>
                      </div>
                      <div>
                        <Label htmlFor="student-name">Student Name</Label>
                        <Input
                          id="student-name"
                          value={newOccupant.student_name}
                          onChange={(e) => setNewOccupant({ ...newOccupant, student_name: e.target.value })}
                          placeholder="Enter student name"
                        />
                      </div>
                      <div>
                        <Label htmlFor="registration-number">Registration Number</Label>
                        <Input
                          id="registration-number"
                          value={newOccupant.registration_number}
                          onChange={(e) => setNewOccupant({ ...newOccupant, registration_number: e.target.value })}
                          placeholder="Enter registration number"
                        />
                      </div>
                      <div>
                        <Label htmlFor="access-number">Access Number</Label>
                        <Input
                          id="access-number"
                          value={newOccupant.access_number}
                          onChange={(e) => setNewOccupant({ ...newOccupant, access_number: e.target.value })}
                          placeholder="Enter access number"
                        />
                      </div>
                      <div className="grid grid-cols-2 gap-4">
                        <div>
                          <Label htmlFor="year-of-study">Year of Study</Label>
                          <Input
                            id="year-of-study"
                            type="number"
                            min="1"
                            max="5"
                            value={newOccupant.year_of_study}
                            onChange={(e) => setNewOccupant({ ...newOccupant, year_of_study: parseInt(e.target.value) || 1 })}
                          />
                        </div>
                        <div>
                          <Label htmlFor="semester">Semester</Label>
                          <Input
                            id="semester"
                            type="number"
                            min="1"
                            max="2"
                            value={newOccupant.semester}
                            onChange={(e) => setNewOccupant({ ...newOccupant, semester: parseInt(e.target.value) || 1 })}
                          />
                        </div>
                      </div>
                    </div>
                    <DialogFooter>
                      <Button onClick={addOccupant}>Add Student</Button>
                    </DialogFooter>
                  </DialogContent>
                </Dialog>
              </div>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Student Name</TableHead>
                    <TableHead>Registration No.</TableHead>
                    <TableHead>Access No.</TableHead>
                    <TableHead>Room</TableHead>
                    <TableHead>Year/Semester</TableHead>
                    <TableHead>Check-in Date</TableHead>
                    <TableHead>Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {occupants.map((occupant) => {
                    const room = rooms.find(r => r.id === occupant.room_id);
                    const hostel = room ? hostels.find(h => h.id === room.hostel_id) : null;
                    return (
                      <TableRow key={occupant.id}>
                        <TableCell className="font-medium">{occupant.student_name}</TableCell>
                        <TableCell>{occupant.registration_number}</TableCell>
                        <TableCell>{occupant.access_number}</TableCell>
                        <TableCell>
                          {hostel?.name} - Room {room?.room_number}
                        </TableCell>
                        <TableCell>
                          Year {occupant.year_of_study}, Sem {occupant.semester}
                        </TableCell>
                        <TableCell>
                          {occupant.check_in_date ? new Date(occupant.check_in_date).toLocaleDateString() : 'N/A'}
                        </TableCell>
                        <TableCell>
                          <div className="flex gap-2">
                            <Button variant="outline" size="sm">
                              <Edit className="h-4 w-4" />
                            </Button>
                            <AlertDialog>
                              <AlertDialogTrigger asChild>
                                <Button variant="outline" size="sm">
                                  <Trash2 className="h-4 w-4 text-destructive" />
                                </Button>
                              </AlertDialogTrigger>
                              <AlertDialogContent>
                                <AlertDialogHeader>
                                  <AlertDialogTitle>Are you sure?</AlertDialogTitle>
                                  <AlertDialogDescription>
                                    This will remove <strong>{occupant.student_name}</strong> (Reg: {occupant.registration_number}) from the room. This action cannot be undone.
                                  </AlertDialogDescription>
                                </AlertDialogHeader>
                                <AlertDialogFooter>
                                  <AlertDialogCancel>Cancel</AlertDialogCancel>
                                  <AlertDialogAction
                                    onClick={() => deleteOccupant(occupant.id, occupant.student_name)}
                                    className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                                  >
                                    Delete
                                  </AlertDialogAction>
                                </AlertDialogFooter>
                              </AlertDialogContent>
                            </AlertDialog>
                          </div>
                        </TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="inventory" className="space-y-4">
          <Card>
            <CardHeader>
              <div className="flex justify-between items-center">
                <div>
                  <CardTitle>Inventory Items</CardTitle>
                  <CardDescription>Manage furniture, bedding, and other items</CardDescription>
                </div>
                <Dialog open={isItemDialogOpen} onOpenChange={setIsItemDialogOpen}>
                  <DialogTrigger asChild>
                    <Button>
                      <Plus className="mr-2 h-4 w-4" />
                      Add Item
                    </Button>
                  </DialogTrigger>
                  <DialogContent className="max-w-md">
                    <DialogHeader>
                      <DialogTitle>Add Inventory Item</DialogTitle>
                      <DialogDescription>Add furniture, bedding, or other items</DialogDescription>
                    </DialogHeader>
                    <div className="space-y-4">
                      <div>
                        <Label htmlFor="item-name">Item Name</Label>
                        <Input
                          id="item-name"
                          value={newItem.name}
                          onChange={(e) => setNewItem({ ...newItem, name: e.target.value })}
                          placeholder="e.g., Bed, Mattress, Blanket"
                        />
                      </div>
                      <div>
                        <Label htmlFor="item-category">Category</Label>
                        <Select value={newItem.category_id} onValueChange={(value) => setNewItem({ ...newItem, category_id: value })}>
                          <SelectTrigger>
                            <SelectValue placeholder="Select category" />
                          </SelectTrigger>
                          <SelectContent>
                            {categories.map((category) => (
                              <SelectItem key={category.id} value={category.id}>
                                {category.name}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>
                      <div>
                        <Label htmlFor="item-hostel">Hostel</Label>
                        <Select value={newItem.hostel_id} onValueChange={(value) => setNewItem({ ...newItem, hostel_id: value })}>
                          <SelectTrigger>
                            <SelectValue placeholder="Select hostel" />
                          </SelectTrigger>
                          <SelectContent>
                            {hostels.map((hostel) => (
                              <SelectItem key={hostel.id} value={hostel.id}>
                                {hostel.name}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>
                      <div>
                        <Label htmlFor="item-quantity">Quantity</Label>
                        <Input
                          id="item-quantity"
                          type="number"
                          value={newItem.quantity}
                          onChange={(e) => setNewItem({ ...newItem, quantity: parseInt(e.target.value) || 1 })}
                        />
                      </div>
                      <div>
                        <Label htmlFor="item-condition">Condition</Label>
                        <Select value={newItem.condition} onValueChange={(value) => setNewItem({ ...newItem, condition: value })}>
                          <SelectTrigger>
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="excellent">Excellent</SelectItem>
                            <SelectItem value="good">Good</SelectItem>
                            <SelectItem value="fair">Fair</SelectItem>
                            <SelectItem value="poor">Poor</SelectItem>
                            <SelectItem value="damaged">Damaged</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                      <div>
                        <Label htmlFor="item-notes">Notes</Label>
                        <Textarea
                          id="item-notes"
                          value={newItem.notes}
                          onChange={(e) => setNewItem({ ...newItem, notes: e.target.value })}
                          placeholder="Additional notes..."
                        />
                      </div>
                    </div>
                    <DialogFooter>
                      <Button onClick={addInventoryItem}>Add Item</Button>
                    </DialogFooter>
                  </DialogContent>
                </Dialog>
              </div>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Item</TableHead>
                    <TableHead>Category</TableHead>
                    <TableHead>Hostel</TableHead>
                    <TableHead>Quantity</TableHead>
                    <TableHead>Condition</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {inventoryItems.map((item) => {
                    const category = categories.find(c => c.id === item.category_id);
                    const hostel = hostels.find(h => h.id === item.hostel_id);
                    return (
                      <TableRow key={item.id}>
                        <TableCell className="font-medium">{item.name}</TableCell>
                        <TableCell>{category?.name}</TableCell>
                        <TableCell>{hostel?.name || 'Unassigned'}</TableCell>
                        <TableCell>{item.quantity}</TableCell>
                        <TableCell>
                          <Badge variant="outline">{item.condition}</Badge>
                        </TableCell>
                        <TableCell>
                          <Badge className={getStatusColor(item.status)}>{item.status}</Badge>
                        </TableCell>
                        <TableCell>
                          <Button variant="outline" size="sm">
                            <Edit className="h-4 w-4" />
                          </Button>
                        </TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}