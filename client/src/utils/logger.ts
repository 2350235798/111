const log = (level: string, args: unknown[]) => {
  const timestamp = new Date().toISOString();
  // eslint-disable-next-line no-console
  console[level as 'info' | 'warn' | 'error' | 'debug']?.(
    `[${timestamp}] [${level.toUpperCase()}]`,
    ...args,
  );
};

export const logger = {
  info: (...args: unknown[]) => log('info', args),
  warn: (...args: unknown[]) => log('warn', args),
  error: (...args: unknown[]) => log('error', args),
  debug: (...args: unknown[]) => log('debug', args),
};

export default logger;
