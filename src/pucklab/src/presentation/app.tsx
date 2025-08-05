import React, { useEffect } from 'react';
import { createRoot } from 'react-dom/client';
import { Robot } from '../domain/robot';
import { isSuccess } from '../domain/result';

const App: React.FC = () => {
  const [robots, setRobots] = React.useState<any[]>([]);
  const [error, setError] = React.useState<string>('');

  const onClick = async () => {
    const result = await window.electronAPI.manageRobots.addRobot(
      new Robot('0.0.0.0', 1)
    );
    if (isSuccess(result)) {
      setRobots(result.data);
      setError('');
    } else {
      setError(result.error);
    }
  };

  useEffect(() => {
    async function fetchData() {
      const result = await window.electronAPI.manageRobots.loadRobots();
      if (isSuccess(result)) {
        setRobots(result.data);
        setError('');
        console.log('Robots config:', result.data);
      } else {
        setError(result.error);
        console.error('Error reading robots config:', result.error);
      }
    }

    fetchData();
  }, []);

  return (
    <>
      <h1>Robots Configuration</h1>
      {error && <p style={{ color: 'red' }}>{error}</p>}
      <ul>
        {robots.map(robot => (
          <li key={robot.ipAddress}>
            <strong>{robot.ipAddress}</strong>:{robot.port}
          </li>
        ))}
      </ul>

      <button type='button' onClick={onClick}>
        Add Robot
      </button>
    </>
  );
};

const root = createRoot(document.body);
root.render(<App />);
