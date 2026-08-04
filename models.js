/**
 * Core cache data structures.
 * These classes represent the memory blocks, cache lines, sets, and the cache itself.
 */
export class MemoryBlock {
  constructor(blockNumber, wordCount) {
    this.blockNumber = blockNumber;
    this.wordCount = wordCount;
    this.words = Array.from({ length: wordCount }, (_, index) => `M${blockNumber}:W${index}`);
  }
}

export class CacheLine {
  constructor(lineId) {
    this.lineId = lineId;
    this.valid = false;
    this.tag = null;
    this.blockNumber = null;
    this.dataWords = [];
    this.lastAccessTime = 0;
    this.highlight = "idle";
  }

  isEmpty() {
    return !this.valid;
  }

  load(block, tag, accessTime) {
    this.valid = true;
    this.tag = tag;
    this.blockNumber = block.blockNumber;
    this.dataWords = [...block.words];
    this.lastAccessTime = accessTime;
    this.highlight = "replacement";
  }

  touch(accessTime) {
    this.lastAccessTime = accessTime;
    this.highlight = "hit";
  }

  resetHighlight() {
    this.highlight = "idle";
  }
}

export class CacheSet {
  constructor(setId, ways, replacementPolicy) {
    this.setId = setId;
    this.ways = ways;
    this.replacementPolicy = replacementPolicy;
    this.lines = Array.from({ length: ways }, (_, index) => new CacheLine(index));
  }

  findLine(tag) {
    return this.lines.find((line) => line.valid && line.tag === tag) || null;
  }

  getVictimIndex() {
    return this.replacementPolicy.selectVictim(this.lines);
  }
}

export class Cache {
  constructor(cacheBlocks, blockSize, replacementPolicy, readPolicy, ways = 8, mainMemoryBlocks = 1024) {
    this.mainMemoryBlocks = mainMemoryBlocks;
    this.cacheBlocks = cacheBlocks;
    this.blockSize = blockSize;
    this.ways = ways;
    this.setCount = Math.max(1, Math.floor(cacheBlocks / this.ways));
    this.replacementPolicy = replacementPolicy;
    this.readPolicy = readPolicy;
    this.sets = Array.from({ length: this.setCount }, (_, index) => new CacheSet(index, this.ways, this.replacementPolicy));
    this.mainMemory = Array.from({ length: this.mainMemoryBlocks }, (_, blockNumber) => new MemoryBlock(blockNumber, this.blockSize));
  }

  reset() {
    this.setCount = Math.max(1, Math.floor(this.cacheBlocks / this.ways));
    this.sets = Array.from({ length: this.setCount }, (_, index) => new CacheSet(index, this.ways, this.replacementPolicy));
    this.mainMemory = Array.from({ length: this.mainMemoryBlocks }, (_, blockNumber) => new MemoryBlock(blockNumber, this.blockSize));
  }

  resetHighlights() {
    this.sets.forEach((set) => set.lines.forEach((line) => line.resetHighlight()));
  }

  getSetForBlock(blockNumber) {
    // find which set this block maps to using modulo
    return this.sets[blockNumber % this.setCount];
  }

  getTagForBlock(blockNumber) {
    // calculate the tag to identify blocks within each set
    return Math.floor(blockNumber / this.setCount);
  }

  accessBlock(blockNumber, accessTime) {
    const set = this.getSetForBlock(blockNumber);
    const tag = this.getTagForBlock(blockNumber);
    const matchingLine = set.findLine(tag);

    const result = {
      hit: false,
      miss: true,
      setIndex: set.setId,
      tag,
      blockNumber,
      victim: null,
      insertedWay: null,
      replaced: false,
      readPolicy: this.readPolicy,
    };

    this.resetHighlights();

    if (matchingLine) {
      // cache hit
      // block is already in cache, just update access time
      matchingLine.touch(accessTime);
      matchingLine.highlight = "hit";
      result.hit = true;
      result.miss = false;
      return result;
    }

    // cache miss
    // select victim line and load block into cache
    const victimIndex = set.getVictimIndex();
    const victimLine = set.lines[victimIndex];
    result.victim = victimLine.valid ? victimLine.blockNumber : null;
    result.replaced = victimLine.valid;

    const block = this.mainMemory[blockNumber];
    victimLine.load(block, tag, accessTime);
    victimLine.highlight = "replacement";
    result.insertedWay = victimIndex;

    return result;
  }
}
