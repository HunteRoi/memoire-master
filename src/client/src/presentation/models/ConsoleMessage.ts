export interface ConsoleMessage {
  timestamp: number;
  type: string;
  translationKey: string;
  translationParams?: Record<string, any>;
  message?: string;
}
