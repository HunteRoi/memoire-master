import React, { useEffect } from 'react';
import { createRoot } from 'react-dom/client';

const App: React.FC = () => {
  const [robots, setRobots] = React.useState<any[]>([]);

  const onClick = () => {
    const newRobots = [...robots, { ip: '0', port: 0 }];
    setRobots(newRobots);
    window.electronAPI.writeRobotsConfig(newRobots);
  };

  useEffect(() => {
    async function fetchData() {
      try {
        const response = await window.electronAPI.readRobotsConfig();
        setRobots(response);
        console.log('Robots config:', response);
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
        {robots.map((robot, index) => (
          <li key={index}>
            <strong>{robot.ip}</strong>:{robot.port}
          </li>
        ))}
      </ul>

      <button onClick={onClick}>
        Add Robot
      </button>
    </>
  );
};

const root = createRoot(document.body);
root.render(<App />);
