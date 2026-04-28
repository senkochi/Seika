export type UserRole = 'STUDENT' | 'TEACHER' | null;
export type Gender = 'male' | 'female' | 'other' | '';

export interface RegisterData {
  role: UserRole;
  fullname: string;
  dateOfBirth: string;
  gender: Gender;
  username: string;
  password: string;
}
