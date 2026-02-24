export enum Page {
  DASHBOARD = 'dashboard',
  PROFILES = 'profiles',
  STUDENTS = 'students',
  REPORTS = 'reports',
  SETTINGS = 'settings',
  ANNOUNCEMENTS = 'announcements',
  PROFILE = 'profile',
  REQUESTS = 'requests',
}

export enum AttendanceStatus {
  PRESENT = 'Present',
  ABSENT = 'Absent',
  LATE = 'Late',
  ON_LEAVE = 'On Leave',
}

export enum ProfileStatus {
  ACTIVE = 'Active',
  ON_LEAVE = 'On Leave',
  TERMINATED = 'Terminated',
}

export type UserRole = 'admin' | 'attendance' | 'teacher' | 'student';

export interface Profile {
  id: string;
  name: string;
  role: string;
  department: string;
  avatar: string;
  email: string;
  joinDate: string;
  phoneNumber?: string;
  address?: string;
  status: ProfileStatus;
  canChangePassword?: boolean;
}

export interface AttendanceRecord {
  id: string;
  profileId: string;
  date: string;
  checkIn: string | null; // HH:mm format
  checkOut: string | null; // HH:mm format
  status: AttendanceStatus;
}

export type DayStatus = 'Work Day' | 'Holiday' | 'Off Day';

export interface DaySchedule {
  day: string;
  status: DayStatus;
  startTime: string;
  endTime: string;
}

export interface Settings {
  companyName: string;
  companyLogo?: string;
  lateThresholdMinutes: number;
  weeklySchedule: DaySchedule[];
  language: 'en' | 'id';
}

export interface Announcement {
  id: string;
  title: string;
  content: string;
  date: string;
  priority: 'Normal' | 'High' | 'Urgent';
}

export interface ProfileRequest {
  id: string;
  profileId: string;
  description: string;
  date: string;
  status: 'Pending' | 'Resolved';
}

export interface AuthUser {
  name: string;
  role: string | null;
  avatar: string | null;
  permissions?: string[];
}

export interface Auth {
  role: UserRole | null;
  user: AuthUser | null;
}