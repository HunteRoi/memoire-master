import type { ReactNode } from 'react';

export interface SettingsSection {
  title: string;
  description?: string;
  content: ReactNode;
}
