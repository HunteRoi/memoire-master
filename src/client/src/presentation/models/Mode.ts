export type Mode = {
  title: ModeType;
  description: string;
  icon: React.ReactNode;
};

export enum ModeType {
  EXPLORATION = 'exploration',
  NAVIGATION = 'navigation',
}
