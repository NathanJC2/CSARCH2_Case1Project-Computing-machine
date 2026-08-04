/**
 * Simulation engine and supporting utilities.
 */
import { Cache } from "./models.js";
import { LRUPolicy, MRUPolicy } from "./policies.js";

export class Statistics {
  constructor(cacheAccessTime, mainMemoryAccessTime) {
    this.cacheAccessTime = cacheAccessTime;
    this.mainMemoryAccessTime = mainMemoryAccessTime;
    this.totalAccesses = 0;
    this.hits = 0;
    this.misses = 0;
    this.totalTime = 0;
  }

  reset() {
    this.totalAccesses = 0;
    this.hits = 0;
    this.misses = 0;
    this.totalTime = 0;
  }

  recordAccess(hit) {
    this.totalAccesses += 1;
    if (hit) {
      this.hits += 1;
      this.totalTime += this.cacheAccessTime;
    } else {
      this.misses += 1;
      this.totalTime += this.cacheAccessTime + this.mainMemoryAccessTime;
    }
  }

  getHitRate() {
    if (this.totalAccesses === 0) {
      return 0;
    }
    return (this.hits / this.totalAccesses) * 100;
  }

  getMissRate() {
    if (this.totalAccesses === 0) {
      return 0;
    }
    return (this.misses / this.totalAccesses) * 100;
  }

  getAmat() {
    if (this.totalAccesses === 0) {
      return 0;
    }
    return this.totalTime / this.totalAccesses;
  }
}

export class Logger {
  constructor() {
    this.entries = [];
  }

  clear() {
    this.entries = [];
  }

  add(entry) {
    this.entries.push(entry);
  }

  toText() {
    if (this.entries.length === 0) {
      return "No trace entries yet.";
    }

    return this.entries
      .map((entry) => {
        const status = entry.hit ? "HIT" : "MISS";
        const replacement = entry.replaced ? `Evicted Block ${entry.victim}` : "No eviction";
        const inserted = entry.insertedWay !== null ? `Inserted in Way ${entry.insertedWay}` : "Cache unchanged";
        return `Access ${entry.accessNumber}\nBlock ${entry.blockNumber}\nSet ${entry.setIndex}\nTag ${entry.tag}\n${status}\n${replacement}\n${inserted}\n---`;
      })
      .join("\n");
  }
}

export class Simulator {
  constructor(config) {
    this.config = config;
    this.cache = new Cache(
      config.cacheBlocks,
      config.blockSize,
      config.replacementPolicy,
      config.readPolicy,
      config.ways,
    );
    this.statistics = new Statistics(config.cacheAccessTime, config.mainMemoryAccessTime);
    this.logger = new Logger();
  }

  generateSequence() {
    const blockCount = this.config.cacheBlocks;
    const testCase = this.config.testCase;

    if (testCase === "sequential") {
      const base = Array.from({ length: 2 * blockCount }, (_, index) => index);
      return [...base, ...base];
    }

    if (testCase === "mid-repeat") {
      const ascending = Array.from({ length: blockCount }, (_, index) => index);
      const extended = Array.from({ length: 2 * blockCount }, (_, index) => index);
      const descending = Array.from({ length: blockCount }, (_, index) => blockCount - 1 - index);
      const extendedDescending = Array.from({ length: 2 * blockCount }, (_, index) => 2 * blockCount - 1 - index);
      return [...ascending, ...extended, ...extended, ...descending, ...extendedDescending];
    }

    const seed = this.config.randomSeed ?? 42;
    const random = this.createRandom(seed);
    return Array.from({ length: 64 }, () => Math.floor(random() * 1024));
  }

  createRandom(seed) {
    let state = seed % 2147483647;
    if (state <= 0) {
      state += 2147483646;
    }
    return () => {
      state = (state * 16807) % 2147483647;
      return (state - 1) / 2147483646;
    };
  }

  reset() {
    this.cache.reset();
    this.statistics.reset();
    this.logger.clear();
  }

  async runSimulation(animationMode = "final", onStep = null) {
    this.reset();
    const sequence = this.generateSequence();

    for (let step = 0; step < sequence.length; step += 1) {
      const blockNumber = sequence[step];
      const result = this.cache.accessBlock(blockNumber, step + 1);
      this.statistics.recordAccess(result.hit);
      this.logger.add({
        accessNumber: step + 1,
        blockNumber,
        setIndex: result.setIndex,
        tag: result.tag,
        hit: result.hit,
        victim: result.victim,
        replaced: result.replaced,
        insertedWay: result.insertedWay,
      });

      if (animationMode === "step") {
        if (typeof onStep === "function") {
          try {
            onStep({ step: step + 1, cache: this.cache, statistics: this.statistics, logger: this.logger, sequence });
          } catch (err) {
            // swallow errors from UI callback to keep simulation running
          }
        }
        await this.wait(220);
      }
    }

    return {
      sequence,
      statistics: this.statistics,
      logger: this.logger,
      cache: this.cache,
    };
  }

  async wait(duration) {
    return new Promise((resolve) => setTimeout(resolve, duration));
  }
}

export function createDefaultPolicy(policyName) {
  return policyName === "mru" ? new MRUPolicy() : new LRUPolicy();
}
