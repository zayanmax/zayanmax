import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Prisma } from '@prisma/client';
import { Socket } from 'net';
import { PrismaService } from '../../database/prisma.service';

type CheckStatus = 'ok' | 'error';

@Injectable()
export class HealthService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly configService: ConfigService,
  ) {}

  liveness() {
    return {
      status: 'ok',
      service: 'zayan-max-backend',
      uptimeSeconds: Math.round(process.uptime()),
      timestamp: new Date().toISOString(),
      ...this.metadata(),
    };
  }

  async readiness() {
    const [database, redis] = await Promise.all([
      this.checkDatabase(),
      this.checkRedis(),
    ]);
    const status =
      database.status === 'ok' && redis.status === 'ok' ? 'ok' : 'degraded';

    return {
      status,
      service: 'zayan-max-backend',
      timestamp: new Date().toISOString(),
      ...this.metadata(),
      checks: { database, redis },
    };
  }

  async summary() {
    return this.readiness();
  }

  private metadata() {
    return {
      version: this.configService.get<string>('BUILD_VERSION') ?? '0.0.1',
      buildSha: this.configService.get<string>('BUILD_SHA') ?? 'local',
      environment: this.configService.get<string>('NODE_ENV') ?? 'development',
    };
  }

  private async checkDatabase(): Promise<{
    status: CheckStatus;
    latencyMs: number;
    message?: string;
  }> {
    const startedAt = Date.now();
    try {
      await this.prisma.$queryRaw(Prisma.sql`SELECT 1`);
      return { status: 'ok', latencyMs: Date.now() - startedAt };
    } catch (error) {
      return {
        status: 'error',
        latencyMs: Date.now() - startedAt,
        message:
          error instanceof Error ? error.message : 'Database check failed',
      };
    }
  }

  private async checkRedis(): Promise<{
    status: CheckStatus;
    latencyMs: number;
    message?: string;
  }> {
    const startedAt = Date.now();
    const redisUrl = this.configService.get<string>('REDIS_URL');
    if (!redisUrl) {
      return {
        status: 'error',
        latencyMs: Date.now() - startedAt,
        message: 'REDIS_URL is not configured',
      };
    }

    try {
      const url = new URL(redisUrl);
      await this.tcpConnect(url.hostname, Number(url.port || 6379), 1200);
      return { status: 'ok', latencyMs: Date.now() - startedAt };
    } catch (error) {
      return {
        status: 'error',
        latencyMs: Date.now() - startedAt,
        message: error instanceof Error ? error.message : 'Redis check failed',
      };
    }
  }

  private tcpConnect(host: string, port: number, timeoutMs: number) {
    return new Promise<void>((resolve, reject) => {
      const socket = new Socket();
      const cleanup = () => {
        socket.removeAllListeners();
        socket.destroy();
      };
      socket.setTimeout(timeoutMs);
      socket.once('connect', () => {
        cleanup();
        resolve();
      });
      socket.once('timeout', () => {
        cleanup();
        reject(new Error(`Redis connection timed out after ${timeoutMs}ms`));
      });
      socket.once('error', (error) => {
        cleanup();
        reject(error);
      });
      socket.connect(port, host);
    });
  }
}
