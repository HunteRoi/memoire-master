import { forwardRef, useImperativeHandle, useRef, useState } from 'react';
import { useTranslation } from 'react-i18next';

import { useAppContext } from '../hooks/useAppContext';
import { Age } from '../models/Age';
import { MIN_AGE, DEFAULT_AGE, MAX_AGE } from '../../domain/constants';
import { AgeCard } from '../components/age/ageCard';
import { AgeInput } from '../components/age/ageInput';
import { AgeControls } from '../components/age/ageControls';

export interface AgeSelectionContentRef {
  navigateUp: () => void;
  navigateDown: () => void;
}

export const AgeSelectionContent = forwardRef<AgeSelectionContentRef>((_, ref) => {
  const { t } = useTranslation();
  const { userAge, setUserAge } = useAppContext();
  const [currentAge, setCurrentAge] = useState<number>(userAge?.value || DEFAULT_AGE);
  const ageInputRef = useRef<HTMLInputElement>(null);

  const isValidAge = (age: number): boolean => {
    return !Number.isNaN(age) && age >= MIN_AGE && age <= MAX_AGE;
  };

  const updateAgeInInput = (age: number): void => {
    if (ageInputRef.current) {
      ageInputRef.current.value = age.toString();
    }
  };

  const saveAge = (age: number): void => {
    setCurrentAge(age);
    setUserAge(new Age(age));
    updateAgeInInput(age);
  };

  const handleInputBlur = (): void => {
    const inputValue = ageInputRef.current?.value || '';
    const parsedAge = parseInt(inputValue, 10);

    if (isValidAge(parsedAge)) {
      saveAge(parsedAge);
    } else {
      const fallbackAge = userAge?.value || DEFAULT_AGE;
      saveAge(fallbackAge);
    }
  };

  const handleIncrementAge = (): void => {
    const newAge = Math.min(MAX_AGE, currentAge + 1);
    saveAge(newAge);
  };

  const handleDecrementAge = (): void => {
    const newAge = Math.max(MIN_AGE, currentAge - 1);
    saveAge(newAge);
  };

  const navigateUp = () => {
    handleIncrementAge();
  };

  const navigateDown = () => {
    handleDecrementAge();
  };

  useImperativeHandle(ref, () => ({
    navigateUp,
    navigateDown,
  }));

  return (
    <AgeCard>
      <AgeInput
        defaultValue={currentAge}
        minAge={MIN_AGE}
        maxAge={MAX_AGE}
        inputRef={ageInputRef}
        onBlur={handleInputBlur}
        yearsOldLabel={t('age.yearsOld')}
      >
        <AgeInput.LeftAdornment>
          <AgeControls
            onIncrement={handleIncrementAge}
            onDecrement={handleDecrementAge}
            incrementLabel={t('age.increment')}
            decrementLabel={t('age.decrement')}
          />
        </AgeInput.LeftAdornment>
      </AgeInput>
    </AgeCard>
  );
});
