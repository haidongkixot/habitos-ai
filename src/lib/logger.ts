import { prisma } from './prisma'

type LogLevel = 'debug' | 'info' | 'warn' | 'error' | 'fatal'

interface LogOptions {
  stack?: string
  metadata?: Record<string, unknown>
  userId?: string
}

export async function log(
  level: LogLevel,
  source: string,
  message: string,
  opts?: LogOptions
) {
  try {
    await prisma.errorLog.create({
      data: {
        level,
        source,
        message,
        stack: opts?.stack ?? null,
        metadata: opts?.metadata ? JSON.stringify(opts.metadata) : null,
        userId: opts?.userId ?? null,
      },
    })
  } catch (err) {
    // Fallback to console if DB write fails
    console.error(`[${level.toUpperCase()}] ${source}: ${message}`, err)
  }
}

export const logger = {
  debug: (source: string, message: string, opts?: LogOptions) =>
    log('debug', source, message, opts),
  info: (source: string, message: string, opts?: LogOptions) =>
    log('info', source, message, opts),
  warn: (source: string, message: string, opts?: LogOptions) =>
    log('warn', source, message, opts),
  error: (source: string, message: string, opts?: LogOptions) =>
    log('error', source, message, opts),
  fatal: (source: string, message: string, opts?: LogOptions) =>
    log('fatal', source, message, opts),
}
