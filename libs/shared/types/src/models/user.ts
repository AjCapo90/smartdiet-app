import { Units, WeekStartDay } from '../enums';

export interface User {
  id: string;
  email: string;
  name: string;
  createdAt: Date;
  updatedAt: Date;
  preferences: UserPreferences;
}

export interface UserPreferences {
  timezone: string;
  weekStartDay: WeekStartDay;
  units: Units;
  language: string;
}

export interface UserWithPassword extends User {
  passwordHash: string;
}
