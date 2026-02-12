
export enum AppRole {
  SUPERADMIN = 'SUPERADMIN',
  VORSTAND = 'VORSTAND',
  USER = 'USER'
}

export type ViewType = 'polls' | 'calendar' | 'members' | 'tasks';

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
  total_votes: number;
  has_voted?: boolean;
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
