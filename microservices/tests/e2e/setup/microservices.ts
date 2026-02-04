/// <reference types="node" />
import { ChildProcess, spawn } from 'child_process';
import { EventEmitter } from 'events';

export interface MicroserviceConfig {
  name: string;
  path: string;
  env: Record<string, string>;
  readyPattern?: RegExp;
  timeout?: number;
}

export class MicroserviceManager extends EventEmitter {
  private processes: Map<string, ChildProcess> = new Map();

  constructor() {
    super();
    // Aumentar límite para múltiples servicios
    (this as EventEmitter).setMaxListeners(20);
  }

  async start(config: MicroserviceConfig): Promise<void> {
    console.log(`🚀 Starting ${config.name}...`);

    const childProcess = spawn('pnpm', ['tsx', config.path], {
      cwd: process.cwd(),
      env: { ...process.env, ...config.env },
      stdio: ['ignore', 'pipe', 'pipe'],
    });

    this.processes.set(config.name, childProcess);

    const setupLogging = (resolve: () => void, reject: (err: Error) => void) => {
      const readyPattern = config.readyPattern || /listening|started|ready|up/i;
      let alreadyResolved = false;

      childProcess.stdout?.on('data', (data) => {
        const output = data.toString();
        console.log(`[${config.name}]`, output.trim());

        if (!alreadyResolved && readyPattern.test(output)) {
          alreadyResolved = true;
          // If it's BFF, we resolve immediately in the special block below, but we keep logging.
          // For others, we resolve here.
          if (config.name !== 'bff') {
            resolve();
          }
        }
      });

      childProcess.stderr?.on('data', (data) => {
        const output = data.toString();
        console.error(`[${config.name} ERROR]`, output.trim());
      });

      childProcess.on('error', (error) => {
        if (!alreadyResolved) {
          alreadyResolved = true;
          reject(error);
        }
      });

      childProcess.on('exit', (code) => {
        if (code !== 0 && code !== null && !alreadyResolved) {
          alreadyResolved = true;
          reject(new Error(`${config.name} exited with code ${code}`));
        }
      });
    };

    if (config.name === 'bff') {
      // Set up logging but resolve differently
      setupLogging(() => { }, () => { });
      await new Promise((resolve) => setTimeout(resolve, 10000));
      console.log(`✅ ${config.name} process started (assuming ready after 10s)`);
      return;
    }

    await new Promise<void>((resolve, reject) => {
      const timeout = setTimeout(() => {
        reject(new Error(`${config.name} no inició a tiempo`));
      }, config.timeout || 45000);

      // Hook up logging which also handles resolution
      setupLogging(() => {
        clearTimeout(timeout);
        console.log(`✅ ${config.name} started`);
        resolve();
      }, (err) => {
        clearTimeout(timeout);
        reject(err);
      });
    });
  }
  async startAll(configs: MicroserviceConfig[]): Promise<void> {
    console.log(`🚀 Starting ${configs.length} microservices sequentially...`);

    for (const config of configs) {
      await this.start(config);
      await new Promise((resolve) => setTimeout(resolve, 1000));
    }

    console.log('⏳ Waiting for services to establish connections...');
    await new Promise((resolve) => setTimeout(resolve, 3000));

    console.log('✅ All microservices started');
  }

  async stopAll(): Promise<void> {
    console.log('🛑 Stopping all microservices...');

    for (const [name, childProcess] of this.processes.entries()) {
      if (childProcess && !childProcess.killed) {
        console.log(`  Stopping ${name}...`);
        childProcess.kill('SIGTERM');
      }
    }

    await new Promise((resolve) => setTimeout(resolve, 2000));

    for (const [name, childProcess] of this.processes.entries()) {
      if (childProcess && !childProcess.killed) {
        console.log(`  Force killing ${name}...`);
        childProcess.kill('SIGKILL');
      }
    }

    this.processes.clear();
    console.log('✅ All microservices stopped');
  }

  getProcess(name: string): ChildProcess | undefined {
    return this.processes.get(name);
  }
}

export async function waitForPort(port: number, timeout: number = 30000): Promise<void> {
  const startTime = Date.now();

  while (Date.now() - startTime < timeout) {
    try {
      const response = await fetch(`http://localhost:${port}/health`);
      if (response.ok) {
        return;
      }
    } catch (error) {
      // Puerto aún no disponible
    }
    await new Promise((resolve) => setTimeout(resolve, 500));
  }

  throw new Error(`Port ${port} no disponible después de ${timeout}ms`);
}
