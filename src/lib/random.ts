export class Random {
  private seed: number;

  constructor(seed: number) {
    this.seed = seed >>> 0;
  }

  next() {
    this.seed = (1664525 * this.seed + 1013904223) >>> 0;
    return this.seed / 4294967296;
  }

  int(min: number, max: number) {
    return Math.floor(this.next() * (max - min + 1)) + min;
  }

  pick<T>(items: T[]): T {
    return items[this.int(0, items.length - 1)];
  }

  chance(probability: number) {
    return this.next() < probability;
  }
}
