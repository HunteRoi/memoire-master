import React, { useEffect } from 'react';
import { createRoot } from 'react-dom/client';
import { Robot } from '../domain/robot';

const App: React.FC = () => {
  const [robots, setRobots] = React.useState<any[]>([]);

  const onClick = async () => {
    const bots = await window.electronAPI.manageRobots.addRobot(new Robot('0.0.0.0', 1));
    setRobots(bots);
  };

  useEffect(() => {
    async function fetchData() {
      try {
        const bots = await window.electronAPI.manageRobots.loadRobots();
        setRobots(bots);
        console.log('Robots config:', bots);
      } catch (error) {
        console.error('Error reading robots config:', error);
      }
    }

    fetchData();
  }, []);

  return (
    <>
      <h1>Robots Configuration</h1>
      <ul>
        {robots.map((robot) => (
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
