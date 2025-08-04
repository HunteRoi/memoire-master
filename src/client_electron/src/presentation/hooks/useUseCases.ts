import { useAppContext } from '../context/AppContext';

export const useUseCases = () => {
  const {
    manageRobotsUseCase,
    robotConnectionUseCase,
  } = useAppContext();

  return {
    manageRobotsUseCase,
    robotConnectionUseCase,
  };
};
