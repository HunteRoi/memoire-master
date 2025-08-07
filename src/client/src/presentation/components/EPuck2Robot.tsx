import type React from 'react';

export const EPuck2Robot: React.FC = () => (
  <svg
    width='200'
    height='200'
    viewBox='0 0 200 200'
    fill='none'
    xmlns='http://www.w3.org/2000/svg'
    role='img'
    aria-label='e-puck2 robot illustration'
  >
    {/* Main body circle */}
    <circle
      cx='100'
      cy='100'
      r='80'
      fill='#2E2E2E'
      stroke='#1A1A1A'
      strokeWidth='2'
    />

    {/* Top ring */}
    <circle
      cx='100'
      cy='100'
      r='75'
      fill='none'
      stroke='#4A4A4A'
      strokeWidth='1'
    />

    {/* LED ring */}
    <circle
      cx='100'
      cy='100'
      r='65'
      fill='none'
      stroke='#666'
      strokeWidth='1'
      strokeDasharray='8 4'
    />

    {/* Front sensors */}
    <circle cx='100' cy='35' r='6' fill='#FF4444' opacity='0.8' />
    <circle cx='85' cy='40' r='4' fill='#FF4444' opacity='0.6' />
    <circle cx='115' cy='40' r='4' fill='#FF4444' opacity='0.6' />
    <circle cx='75' cy='50' r='3' fill='#FF4444' opacity='0.4' />
    <circle cx='125' cy='50' r='3' fill='#FF4444' opacity='0.4' />

    {/* Side sensors */}
    <circle cx='35' cy='100' r='4' fill='#FF4444' opacity='0.5' />
    <circle cx='165' cy='100' r='4' fill='#FF4444' opacity='0.5' />

    {/* Back sensors */}
    <circle cx='85' cy='165' r='3' fill='#FF4444' opacity='0.4' />
    <circle cx='115' cy='165' r='3' fill='#FF4444' opacity='0.4' />

    {/* Center logo/name area */}
    <circle
      cx='100'
      cy='100'
      r='35'
      fill='#3A3A3A'
      stroke='#555'
      strokeWidth='1'
    />

    {/* e-puck2 text */}
    <text
      x='100'
      y='95'
      textAnchor='middle'
      fill='#CCCCCC'
      fontSize='12'
      fontFamily='monospace'
      fontWeight='bold'
    >
      e-puck2
    </text>

    {/* Wheels */}
    <rect
      x='15'
      y='85'
      width='20'
      height='30'
      rx='10'
      fill='#1A1A1A'
      stroke='#333'
      strokeWidth='1'
    />
    <rect
      x='165'
      y='85'
      width='20'
      height='30'
      rx='10'
      fill='#1A1A1A'
      stroke='#333'
      strokeWidth='1'
    />

    {/* Wheel treads */}
    <line x1='20' y1='90' x2='20' y2='110' stroke='#666' strokeWidth='1' />
    <line x1='25' y1='90' x2='25' y2='110' stroke='#666' strokeWidth='1' />
    <line x1='30' y1='90' x2='30' y2='110' stroke='#666' strokeWidth='1' />

    <line x1='170' y1='90' x2='170' y2='110' stroke='#666' strokeWidth='1' />
    <line x1='175' y1='90' x2='175' y2='110' stroke='#666' strokeWidth='1' />
    <line x1='180' y1='90' x2='180' y2='110' stroke='#666' strokeWidth='1' />

    {/* Camera */}
    <circle
      cx='100'
      cy='25'
      r='8'
      fill='#1A1A1A'
      stroke='#333'
      strokeWidth='1'
    />
    <circle cx='100' cy='25' r='5' fill='#333' />
    <circle cx='100' cy='25' r='2' fill='#666' />

    {/* Direction indicator (front) */}
    <polygon points='100,55 95,65 105,65' fill='#00AA00' opacity='0.8' />
  </svg>
);
