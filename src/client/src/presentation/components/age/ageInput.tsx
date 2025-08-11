import { FormControl, InputAdornment, TextField } from '@mui/material';
import type React from 'react';
import {
  Children,
  isValidElement,
  type PropsWithChildren,
  type ReactElement,
} from 'react';

type LeftAdornmentProps = PropsWithChildren;

const LeftAdornment: React.FC<LeftAdornmentProps> = ({ children }) => {
  return <>{children}</>;
};

interface AgeInputProps {
  defaultValue: number;
  minAge: number;
  maxAge: number;
  inputRef: React.RefObject<HTMLInputElement | null>;
  onBlur: () => void;
  yearsOldLabel: string;
}
const AgeInputComponent: React.FC<PropsWithChildren<AgeInputProps>> = ({
  defaultValue,
  minAge,
  maxAge,
  inputRef,
  onBlur,
  yearsOldLabel,
  children,
}) => {
  const leftAdornmentChild = Children.toArray(children).find(
    child => child && isValidElement(child) && child.type === LeftAdornment
  ) as ReactElement<LeftAdornmentProps, typeof LeftAdornment> | undefined;

  return (
    <FormControl sx={{ m: 1 }}>
      <TextField
        type='number'
        defaultValue={defaultValue}
        inputRef={inputRef}
        onBlur={onBlur}
        variant='standard'
        sx={{
          '& .MuiInput-underline:before': {
            borderBottom: 'none',
          },
          '& .MuiInput-underline:after': {
            borderBottom: 'none',
          },
          '& .MuiInput-underline:hover:not(.Mui-disabled):before': {
            borderBottom: 'none',
          },
          '& .MuiInputBase-input': {
            fontSize: '4rem',
            textAlign: 'center',
            '&::-webkit-outer-spin-button, &::-webkit-inner-spin-button': {
              WebkitAppearance: 'none',
              margin: 0,
            },
            '&[type=number]': {
              MozAppearance: 'textfield',
            },
          },
        }}
        slotProps={{
          htmlInput: {
            min: minAge,
            max: maxAge,
          },
          input: {
            startAdornment: leftAdornmentChild && (
              <InputAdornment position='start'>
                {leftAdornmentChild.props.children}
              </InputAdornment>
            ),
            endAdornment: (
              <InputAdornment position='end' sx={{ fontSize: '3rem' }}>
                {yearsOldLabel}
              </InputAdornment>
            ),
          },
        }}
      />
    </FormControl>
  );
};

export const AgeInput = Object.assign(AgeInputComponent, {
  LeftAdornment,
});
