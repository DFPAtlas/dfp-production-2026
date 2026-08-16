import type { DemoEvent, Guest, Supplier, ScheduleItem, ActivityEvent } from './types'

export const event: DemoEvent = {
  id: 'gala-2026',
  name: 'Aurora Foundation Gala',
  venue: 'The Grand Pavilion, London',
  date: 'Saturday, 28 November 2026',
  timeStart: '18:00',
  timeEnd: '01:00',
  guestCount: 340,
  rsvpCount: 287,
  supplierCount: 12,
  budget: '£48,000',
  spent: '£34,200',
  status: 'planning',
}

export const initialGuests: Guest[] = [
  { id: 'g1', name: 'Victoria Ashworth', email: 'v.ashworth@example.com', rsvp: 'yes', dietary: 'Vegetarian', table: 'Table 1', plusOne: true, checkedIn: false },
  { id: 'g2', name: 'Sir James Harrington', email: 'j.harrington@example.com', rsvp: 'yes', dietary: 'None', table: 'Table 1', plusOne: true, checkedIn: false },
  { id: 'g3', name: 'Dr Eleanor Chen', email: 'e.chen@example.com', rsvp: 'yes', dietary: 'Gluten-free', table: 'Table 2', plusOne: false, checkedIn: false },
  { id: 'g4', name: 'Marcus Okonkwo', email: 'm.okonkwo@example.com', rsvp: 'yes', dietary: 'None', table: 'Table 2', plusOne: true, checkedIn: false },
  { id: 'g5', name: 'Sarah Whitmore', email: 's.whitmore@example.com', rsvp: 'pending', dietary: '', table: 'Table 3', plusOne: false, checkedIn: false },
  { id: 'g6', name: 'Prof. David Sterling', email: 'd.sterling@example.com', rsvp: 'yes', dietary: 'Vegan', table: 'Table 3', plusOne: false, checkedIn: false },
  { id: 'g7', name: 'Isabella Rossi', email: 'i.rossi@example.com', rsvp: 'no', dietary: '', table: 'Table 4', plusOne: true, checkedIn: false },
  { id: 'g8', name: 'Oliver Bennett', email: 'o.bennett@example.com', rsvp: 'yes', dietary: 'None', table: 'Table 4', plusOne: true, checkedIn: false },
]

export const initialSuppliers: Supplier[] = [
  { id: 's1', name: 'Crystal Catering Co.', service: 'Catering', contact: 'Amelia Ford', status: 'confirmed', cost: '£12,500', paid: false, notes: '3-course plated dinner' },
  { id: 's2', name: 'Verdant Florals', service: 'Floral Design', contact: 'Tom Green', status: 'booked', cost: '£4,200', paid: false, notes: 'Table centres and entrance arch' },
  { id: 's3', name: 'Pulse AV', service: 'Audio Visual', contact: 'Raj Patel', status: 'confirmed', cost: '£6,800', paid: true, notes: 'Stage lighting and sound' },
  { id: 's4', name: 'The Velvet Groove', service: 'Live Band', contact: 'Nina Cole', status: 'booked', cost: '£3,500', paid: false, notes: '6-piece band, 2x45min sets' },
  { id: 's5', name: 'Snapbox Studios', service: 'Photography', contact: 'Chris Hale', status: 'confirmed', cost: '£2,800', paid: true, notes: 'Full event coverage' },
  { id: 's6', name: 'Luxe Linen Hire', service: 'Linen & Furniture', contact: 'Priya Singh', status: 'booked', cost: '£1,900', paid: false, notes: 'Delivery 10am event day' },
]

export const initialSchedule: ScheduleItem[] = [
  { id: 'sc1', time: '08:00', title: 'Venue setup begins', description: 'Furniture, staging and AV installation', category: 'setup', status: 'pending', assignee: 'Venue team' },
  { id: 'sc2', time: '12:00', title: 'Catering prep', description: 'Kitchen setup and prep begins', category: 'setup', status: 'pending', assignee: 'Crystal Catering' },
  { id: 'sc3', time: '15:00', title: 'Floral installation', description: 'Table centres and entrance displays', category: 'setup', status: 'pending', assignee: 'Verdant Florals' },
  { id: 'sc4', time: '17:00', title: 'Final venue walkthrough', description: 'Check all areas ready', category: 'setup', status: 'pending', assignee: 'Event manager' },
  { id: 'sc5', time: '18:00', title: 'Guest arrival & champagne', description: 'Welcome drinks in the foyer', category: 'ceremony', status: 'pending', assignee: 'Front of house' },
  { id: 'sc6', time: '19:00', title: 'Dinner service', description: '3-course seated dinner', category: 'dining', status: 'pending', assignee: 'Crystal Catering' },
  { id: 'sc7', time: '21:00', title: 'Live band set 1', description: 'First 45-minute performance', category: 'entertainment', status: 'pending', assignee: 'The Velvet Groove' },
  { id: 'sc8', time: '22:30', title: 'Live band set 2', description: 'Second 45-minute performance', category: 'entertainment', status: 'pending', assignee: 'The Velvet Groove' },
  { id: 'sc9', time: '00:00', title: 'Last orders at bar', description: 'Bar service concludes', category: 'breakdown', status: 'pending', assignee: 'Bar team' },
  { id: 'sc10', time: '01:00', title: 'Guest departure', description: 'Coaches arrive for guest transport', category: 'breakdown', status: 'pending', assignee: 'Transport coordinator' },
]

export const initialActivity: ActivityEvent[] = [
  { id: 'a1', time: '09:30', message: 'Final headcount confirmed: 287 guests', type: 'guest' },
  { id: 'a2', time: '09:15', message: 'Crystal Catering confirmed menu selections', type: 'supplier' },
  { id: 'a3', time: '08:45', message: 'AV equipment checklist verified', type: 'supplier' },
  { id: 'a4', time: '08:20', message: 'Venue access keys collected', type: 'system' },
]