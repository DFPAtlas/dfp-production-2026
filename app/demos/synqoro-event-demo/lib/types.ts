export type ViewKey = 'overview' | 'guests' | 'suppliers' | 'schedule' | 'live' | 'reports'

export interface DemoEvent {
  id: string
  name: string
  venue: string
  date: string
  timeStart: string
  timeEnd: string
  guestCount: number
  rsvpCount: number
  supplierCount: number
  budget: string
  spent: string
  status: 'planning' | 'confirmed' | 'live' | 'completed'
}

export interface Guest {
  id: string
  name: string
  email: string
  rsvp: 'yes' | 'no' | 'pending'
  dietary: string
  table: string
  plusOne: boolean
  checkedIn: boolean
}

export interface Supplier {
  id: string
  name: string
  service: string
  contact: string
  status: 'booked' | 'confirmed' | 'on_site' | 'completed'
  cost: string
  paid: boolean
  notes: string
}

export interface ScheduleItem {
  id: string
  time: string
  title: string
  description: string
  category: 'setup' | 'ceremony' | 'dining' | 'entertainment' | 'breakdown'
  status: 'pending' | 'in_progress' | 'completed'
  assignee: string
}

export interface ActivityEvent {
  id: string
  time: string
  message: string
  type: 'system' | 'guest' | 'supplier' | 'schedule' | 'milestone'
}