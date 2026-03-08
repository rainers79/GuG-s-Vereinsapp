export enum AppRole {
  SUPERADMIN = 'SUPERADMIN',
  VORSTAND = 'VORSTAND',
  USER = 'USER',
  VISITOR = 'VISITOR'
}

export type ViewType =
  | 'dashboard'
  | 'projects'
  | 'polls'
  | 'calendar'
  | 'members'
  | 'tasks'
  | 'settings'
  | 'pos'
  | 'pos-admin'
  | 'project-chat'
  | 'project-coreteam';

export type CalendarViewMode = 'month' | 'year' | 'year-list' | 'day';

export interface CalendarEvent {
  id: string;
  title: string;
  description: string;
  date: string;
  type: 'poll' | 'task' | 'event';
  status: 'red' | 'orange' | 'green';
  author: string;
  author_id?: number;
  linkedPollId?: number;
  is_private?: boolean;
}

export interface WPUserResponse {
  token: string;
  user_email: string;
  user_display_name: string;
  user_nicename: string;
}

export interface User {
  id: number;
  email: string;
  displayName: string;
  username: string;
  role: AppRole;
}

export interface RegistrationData {
  firstName: string;
  lastName: string;
  birthday: string;
  email: string;
  username: string;
  password: string;
}

export interface PollOption {
  id: string;
  text: string;
  votes: number;
}

export interface Poll {
  id: number;
  question: string;
  options: PollOption[];
  created_at: string;
  target_date?: string;
  author_id: number;
  author_name?: string;
  total_votes: number;
  has_voted?: boolean;
  is_multiple_choice?: boolean;
}

export interface ApiError {
  message: string;
  code?: string;
  status?: number;
}

export interface VoteResponse {
  success: boolean;
  message: string;
  poll: Poll;
}

export interface MemberMeta {
  first_name: string;
  last_name: string;
  birthday: string;
  phone: string;
  address: string;
  title: string;
}

export interface Member {
  id: number;
  username: string;
  email: string;
  display_name: string;
  roles: string[];
  meta: MemberMeta;
}

export interface ProjectLite {
  id: number;
  title?: string;
  description?: string;
  created_at?: string;
  updated_at?: string;
  start_date?: string | null;
  end_date?: string | null;
  next_date?: string | null;
  target_date?: string | null;
}

export interface Task {
  id: number;
  event_id?: number | null;
  poll_id?: number | null;
  project_id?: number | null;
  title: string;
  description?: string;
  assigned_user_id?: number | null;
  role_tag?: string | null;
  deadline_date?: string | null;
  completed: boolean;
  completed_by?: number | null;
  completed_at?: string | null;
  created_by?: number | null;
  created_at?: string;
}

export interface NotificationSettings {
  chatEnabled: boolean;
  pollEnabled: boolean;
  chatPreview: boolean;
  pollPreview: boolean;
}

export interface ChatMessage {
  id: number;
  user_id: number;
  display_name: string;
  message: string;
  created_at: string;
  profile_image_url?: string;
  receiver_id?: number | null;
}

/* =====================================================
   PROJECT CHAT TYPES
===================================================== */

export interface ProjectChatGroup {
  id: number;
  project_id: number;
  name: string;
  can_write: boolean;
  can_upload_images: boolean;
  created_by: number;
  created_at: string;
  updated_at?: string | null;
}

export interface ProjectChatGroupMember {
  group_id: number;
  user_id: number;
  display_name: string;
  email: string;
  username: string;
  profile_image_url?: string;
  created_at: string;
}

export interface ProjectChatPermission {
  group_id: number;
  user_id: number;
  display_name: string;
  email: string;
  username: string;
  can_write_override: boolean | null;
  can_upload_images_override: boolean | null;
  created_at: string;
  updated_at?: string | null;
}

export interface ProjectChatMessage {
  id: number;
  project_id: number;
  group_id: number;
  user_id: number;
  display_name: string;
  message: string;
  message_type: 'text' | 'image';
  attachment_url?: string | null;
  created_at: string;
  profile_image_url?: string;
}

/* =====================================================
   CORETEAM TYPES
===================================================== */

export interface ProjectCoreTeamMember {
  project_id: number;
  user_id: number;
  display_name: string;
  email: string;
  username: string;
  profile_image_url?: string;
  assigned_tasks_count: number;
  open_tasks_count: number;
  completed_tasks_count: number;
  created_at: string;
}

/* =====================================================
   POS TYPES (PHASE 1)
===================================================== */

export type PosCategory = 'food' | 'drink' | 'gug';

export interface PosArticle {
  id: number;
  name: string;
  category: PosCategory;
  price_cents: number;
  is_active: number;
  sort_order: number;
  bg_color?: string;
}

export interface PosOrderItem {
  article_id: number;
  article_name_snapshot: string;
  category_snapshot: PosCategory;
  price_cents_snapshot: number;
  qty: number;
  line_total_cents: number;
}

export interface PosOrder {
  id: number;
  order_number: string;
  waiter_user_id: number;
  status: 'open' | 'paid' | 'canceled';
  total_cents: number;
  received_cents: number;
  change_cents: number;
  created_at: string;
  paid_at: string | null;
  note: string;
  items: PosOrderItem[];
}

export interface PosDailyReport {
  success: boolean;
  date_from: string;
  date_to: string;
  total_cents: number;
  orders_count: number;
  breakdown_by_waiter: {
    waiter_user_id: number;
    total_cents: number;
    orders_count: number;
  }[];
}
