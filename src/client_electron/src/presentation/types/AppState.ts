import { Robot } from '../../domain/entities/Robot';
import { ThemeType } from '../types/Theme';
import { Age } from '../types/Age';
import { ModeType } from '../types/Mode';

export type AppState = {
  robotsList: Robot[];
  theme: ThemeType;
  userAge?: Age | null;
  selectedRobot?: string | null;
  selectedMode?: ModeType | null;
  isLoading: boolean;
  error: string | null;
};
