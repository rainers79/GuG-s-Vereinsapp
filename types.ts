
export enum AppRole {
  SUPERADMIN = 'SUPERADMIN',
  VORSTAND = 'VORSTAND',
  USER = 'USER',
  VISITOR = 'VISITOR'
}

export type ViewType = 'polls' | 'calendar' | 'members' | 'tasks' | 'settings';
export type CalendarViewMode = 'month' | 'year' | 'day';

export interface CalendarEvent {
  id: string;
  title: string;
  description: string;
  date: string; // ISO String
  type: 'poll' | 'task' | 'event';
  status: 'red' | 'orange' | 'green';
  author: string;
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
