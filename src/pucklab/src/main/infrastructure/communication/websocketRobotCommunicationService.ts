import WebSocket from 'ws';

import type { Robot } from '../../../domain/robot';
import type { RobotCommunicationService } from '../../../main/application/interfaces/robotCommunicationService';

interface ConnectedRobot {
  robot: Robot;
  websocket: WebSocket;
  connected: boolean;
  lastPing: number;
}

interface RobotMessage {
  type: 'command' | 'ping' | 'status';
  data: any;
  timestamp: number;
}

interface RobotResponse {
  type: 'success' | 'error' | 'status' | 'pong';
  data?: any;
  message?: string;
  timestamp: number;
}

export class WebsocketRobotCommunicationService implements RobotCommunicationService {
  private connectedRobots: Map<string, ConnectedRobot> = new Map();
  private readonly connectionTimeout = 10000; // 10 seconds
  private readonly pingInterval = 30000; // 30 seconds
  private pingTimer?: NodeJS.Timeout;

  constructor() {
    this.startPingTimer();
  }

  async connect(robot: Robot): Promise<Robot> {
    const robotKey = this.getRobotKey(robot);
    
    // Check if already connected
    if (this.connectedRobots.has(robotKey)) {
      const existing = this.connectedRobots.get(robotKey)!;
      if (existing.connected) {
        return robot;
      }
    }

    return new Promise((resolve, reject) => {
      const wsUrl = `ws://${robot.ipAddress}:${robot.port}/robot`;
      const ws = new WebSocket(wsUrl);

      const connectionTimer = setTimeout(
        () => {
          ws.terminate();
          reject(new Error(`Connection timeout to robot ${robot.id}`));
        }, 
        this.connectionTimeout
      );

      ws.on('open', () => {
        clearTimeout(connectionTimer);
        console.log(`✅ Connected to robot ${robot.id} at ${wsUrl}`);
        
        const connectedRobot: ConnectedRobot = {
          robot,
          websocket: ws,
          connected: true,
          lastPing: Date.now()
        };
        
        this.connectedRobots.set(robotKey, connectedRobot);
        
        this.sendMessage(ws, {
          type: 'status',
          data: { status: 'connected', client: 'pucklab' },
          timestamp: Date.now()
        });
        
        resolve(robot);
      });

      ws.on('message', (data: WebSocket.Data) => {
        this.handleRobotMessage(robotKey, data);
      });

      ws.on('error', (error) => {
        clearTimeout(connectionTimer);
        console.error(`❌ WebSocket error for robot ${robot.id}:`, error);
        this.removeRobot(robotKey);
        reject(error);
      });

      ws.on('close', (code, reason) => {
        clearTimeout(connectionTimer);
        console.log(`🔌 Disconnected from robot ${robot.id}. Code: ${code}, Reason: ${reason}`);
        this.removeRobot(robotKey);
      });
    });
  }

  async disconnect(robot: Robot): Promise<Robot> {
    const robotKey = this.getRobotKey(robot);
    const connectedRobot = this.connectedRobots.get(robotKey);
    
    if (!connectedRobot) {
      return robot;
    }

    return new Promise((resolve) => {
      this.sendMessage(connectedRobot.websocket, {
        type: 'status',
        data: { status: 'disconnecting' },
        timestamp: Date.now()
      });

      connectedRobot.websocket.close(1000, 'Client disconnect');
      this.removeRobot(robotKey);
      
      console.log(`👋 Disconnected from robot ${robot.id}`);
      resolve(robot);
    });
  }

  async isConnected(robot: Robot): Promise<boolean> {
    const robotKey = this.getRobotKey(robot);
    const connectedRobot = this.connectedRobots.get(robotKey);
    
    return connectedRobot?.connected && 
           connectedRobot.websocket.readyState === WebSocket.OPEN || false;
  }

  async sendCommand(robot: Robot, command: string): Promise<unknown> {
    const robotKey = this.getRobotKey(robot);
    const connectedRobot = this.connectedRobots.get(robotKey);
    
    if (!connectedRobot || !connectedRobot.connected) {
      throw new Error(`Robot ${robot.id} is not connected`);
    }

    if (connectedRobot.websocket.readyState !== WebSocket.OPEN) {
      throw new Error(`Robot ${robot.id} connection is not ready`);
    }

    return new Promise((resolve, reject) => {
      const message: RobotMessage = {
        type: 'command',
        data: { command, source: 'pucklab' },
        timestamp: Date.now()
      };

      const responseTimeout = setTimeout(
        reject,
        30000,
        new Error(`Command timeout for robot ${robot.id}`)
      );

      const originalHandler = connectedRobot.websocket.onmessage;
      connectedRobot.websocket.onmessage = (event) => {
        try {
          const response: RobotResponse = JSON.parse(event.data.toString());
          if (response.type === 'success' || response.type === 'error') {
            clearTimeout(responseTimeout);
            connectedRobot.websocket.onmessage = originalHandler;
            
            if (response.type === 'error') {
              reject(new Error(response.message || 'Robot command failed'));
            } else {
              resolve(response.data);
            }
          }
        } catch (error) {
          if (originalHandler) originalHandler(event);
        }
      };

      this.sendMessage(connectedRobot.websocket, message);
    });
  }

  private async disconnectAll(): Promise<void> {
    if (this.pingTimer) {
      clearInterval(this.pingTimer);
    }

    await Promise.all(
      Array.from(this.connectedRobots.values())
        .map(connectedRobot => this.disconnect(connectedRobot.robot))
    );
  }

  private getRobotKey(robot: Robot): string {
    return `${robot.ipAddress}:${robot.port}`;
  }

  private removeRobot(robotKey: string): void {
    const connectedRobot = this.connectedRobots.get(robotKey);
    if (connectedRobot) {
      connectedRobot.connected = false;
      this.connectedRobots.delete(robotKey);
    }
  }

  private sendMessage(ws: WebSocket, message: RobotMessage): void {
    if (ws.readyState === WebSocket.OPEN) {
      ws.send(JSON.stringify(message));
    }
  }

  private handleRobotMessage(robotKey: string, data: WebSocket.Data): void {
    const connectedRobot = this.connectedRobots.get(robotKey);
    if (!connectedRobot) return;

    try {
      const response: RobotResponse = JSON.parse(data.toString());
      
      switch (response.type) {
        case 'pong':
          connectedRobot.lastPing = Date.now();
          console.log(`🏓 Pong received from robot ${connectedRobot.robot.id}`);
          break;
          
        case 'status':
          console.log(`📊 Status from robot ${connectedRobot.robot.id}:`, response.data);
          break;
          
        case 'error':
          console.error(`❌ Error from robot ${connectedRobot.robot.id}:`, response.message);
          break;
          
        default:
          console.log(`📨 Message from robot ${connectedRobot.robot.id}:`, response);
      }
    } catch (error) {
      console.error(`Failed to parse message from robot ${connectedRobot.robot.id}:`, error);
    }
  }

  private startPingTimer(): void {
    this.pingTimer = setInterval(this.sendPingsToRobots.bind(this), this.pingInterval);
  }

  private sendPingsToRobots(): void {
    const now = Date.now();
    
    this.connectedRobots.forEach((connectedRobot, robotKey) => {
      if (connectedRobot.connected) {
        this.sendMessage(connectedRobot.websocket, {
          type: 'ping',
          data: {},
          timestamp: now
        });
        
        if (now - connectedRobot.lastPing > this.pingInterval * 2) {
          console.warn(`⚠️ Robot ${connectedRobot.robot.id} ping timeout, disconnecting...`);
          setTimeout(connectedRobot.websocket.terminate.bind(connectedRobot.websocket), 0);
          setTimeout(this.removeRobot.bind(this), 0, robotKey);
        }
      }
    });
  }
}
