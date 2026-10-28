import { loadYoga, type Yoga } from 'yoga-layout/load';

let instance: Promise<Yoga> | undefined;

/** Loads the Yoga layout engine once and reuses it. */
export function getYoga(): Promise<Yoga> {
  instance ??= loadYoga();
  return instance;
}
