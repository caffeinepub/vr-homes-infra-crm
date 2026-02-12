// Development-only performance instrumentation for startup timing
const isDev = import.meta.env.DEV;

interface PerfMark {
  name: string;
  startTime: number;
}

const marks = new Map<string, PerfMark>();

export function markStart(name: string): void {
  if (!isDev) return;
  marks.set(name, { name, startTime: performance.now() });
}

export function markEnd(name: string): void {
  if (!isDev) return;
  const mark = marks.get(name);
  if (!mark) return;
  const duration = performance.now() - mark.startTime;
  console.log(`[Perf] ${name}: ${duration.toFixed(2)}ms`);
  marks.delete(name);
}

export function measure(name: string, fn: () => void): void {
  if (!isDev) {
    fn();
    return;
  }
  markStart(name);
  fn();
  markEnd(name);
}

export async function measureAsync<T>(name: string, fn: () => Promise<T>): Promise<T> {
  if (!isDev) {
    return fn();
  }
  markStart(name);
  try {
    const result = await fn();
    markEnd(name);
    return result;
  } catch (error) {
    markEnd(name);
    throw error;
  }
}
