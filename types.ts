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
  | 'project-coreteam'
  | 'project-shopping'
  | 'project-invoices';

export type CalendarViewMode = 'month' | 'year' | 'year-list' | 'day';
export type ProjectStatus = 'active' | 'archived' | 'deleted';

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
  status?: ProjectStatus;
  archived_at?: string | null;
  deleted_at?: string | null;
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
   PROJECT SHOPPING TYPES
===================================================== */

export type ProjectShoppingStatus = 'open' | 'bought';

export interface ProjectShoppingItem {
  id: number;
  project_id: number;
  title: string;
  description?: string;
  quantity?: string;
  unit?: string;
  status: ProjectShoppingStatus;
  assigned_user_id?: number | null;
  assigned_user_name?: string | null;
  linked_task_id?: number | null;
  created_by?: number | null;
  created_at?: string;
  updated_at?: string | null;
  completed_at?: string | null;
  completed_by?: number | null;
  completed_by_name?: string | null;
}

export interface CreateProjectShoppingItemPayload {
  project_id: number;
  title: string;
  description?: string;
  quantity?: string;
  unit?: string;
  assigned_user_id?: number | null;
}

export interface UpdateProjectShoppingItemPayload {
  project_id?: number;
  title?: string;
  description?: string;
  quantity?: string;
  unit?: string;
  status?: ProjectShoppingStatus;
  assigned_user_id?: number | null;
}

/* =====================================================
   PROJECT INVOICE TYPES
===================================================== */

export interface ProjectInvoiceItem {
  id: number;
  project_id: number;
  uploaded_by: number;
  uploaded_by_name?: string | null;
  attachment_id: number;
  file_url: string;
  file_type: string;
  original_filename: string;
  created_at: string;
  updated_at?: string | null;
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
   POS TYPES
===================================================== */

export type PosCategory = 'food' | 'drink' | 'gug';
export type PosOrderStatus = 'paid' | 'canceled';

export interface PosArticle {
  id: number;
  project_id: number;
  name: string;
  category: PosCategory;
  serving_label?: string;
  price_cents: number;
  is_active: number;
  sort_order: number;
  bg_color?: string;
  created_by?: number;
  created_at?: string;
  updated_at?: string;
}

export interface PosOrderItem {
  id?: number;
  order_id?: number;
  article_id: number;
  article_name_snapshot: string;
  category_snapshot: PosCategory;
  serving_label_snapshot?: string;
  price_cents_snapshot: number;
  qty: number;
  line_total_cents: number;
}

export interface PosOrder {
  id: number;
  project_id: number;
  local_uuid?: string;
  order_number: string;
  waiter_user_id: number;
  waiter_user_name?: string | null;
  status: PosOrderStatus;
  total_cents: number;
  received_cents: number;
  change_cents: number;
  note: string;
  created_at: string;
  paid_at: string | null;
  canceled_at?: string | null;
  canceled_by?: number | null;
  canceled_by_name?: string | null;
  cancel_reason?: string;
  items: PosOrderItem[];
}

export interface PosCashOpening {
  success: boolean;
  project_id: number;
  cash_date: string;
  opening_cents: number;
  created_by?: number | null;
  created_by_name?: string | null;
  created_at?: string | null;
  updated_at?: string | null;
}

export interface PosDailyReportWaiterRow {
  waiter_user_id: number;
  waiter_user_name?: string | null;
  paid_total_cents: number;
  canceled_total_cents: number;
  net_total_cents: number;
  orders_count: number;
  canceled_orders_count: number;
}

export interface PosDailyReport {
  success: boolean;
  project_id: number;
  cash_date: string;
  date_from: string;
  date_to: string;
  opening_cents: number;
  paid_total_cents: number;
  canceled_total_cents: number;
  net_total_cents: number;
  cash_expected_cents: number;
  total_cents: number;
  orders_count: number;
  canceled_orders_count: number;
  breakdown_by_waiter: PosDailyReportWaiterRow[];
}
