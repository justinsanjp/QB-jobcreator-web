export interface JobGrade {
  level: number;
  name: string;
  payment: number;
  isBoss: boolean;
}

export interface JobData {
  name: string;
  label: string;
  defaultDuty: boolean;
  offDutyPay: boolean;
  grades: JobGrade[];
  description?: string; // For fxmanifest description
  author?: string; // For fxmanifest author
}

export type GeneratedFile = {
  filename: string;
  language: 'sql' | 'lua';
  content: string;
}