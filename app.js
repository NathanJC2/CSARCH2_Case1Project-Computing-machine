import "./ui.js";
/*
class MemoryBlock {
  constructor(blockNumber, wordCount) {
    this.blockNumber = blockNumber;
    this.wordCount = wordCount;
    this.words = Array.from({ length: wordCount }, (_, index) => `M${blockNumber}:W${index}`);
  }
}

class CacheLine {
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

class ReplacementPolicy {
  constructor(name) {
    this.name = name;
  }

  selectVictim(lines) {
    throw new Error("Replacement policy must implement selectVictim.");
  }

  updateAccess(line, accessTime) {
    line.touch(accessTime);
  }
}

class LRUPolicy extends ReplacementPolicy {
  constructor() {
    super("LRU");
  }

  selectVictim(lines) {
    const invalidIndex = lines.findIndex((line) => !line.valid);
    if (invalidIndex !== -1) {
      return invalidIndex;
    }

    return lines.reduce((winnerIndex, currentLine, currentIndex) => {
      if (currentLine.lastAccessTime < lines[winnerIndex].lastAccessTime) {
        return currentIndex;
      }
      return winnerIndex;
    }, 0);
  }
}

class MRUPolicy extends ReplacementPolicy {
  constructor() {
    super("MRU");
  }

  selectVictim(lines) {
    const invalidIndex = lines.findIndex((line) => !line.valid);
    if (invalidIndex !== -1) {
      return invalidIndex;
    }

    return lines.reduce((winnerIndex, currentLine, currentIndex) => {
      if (currentLine.lastAccessTime > lines[winnerIndex].lastAccessTime) {
        return currentIndex;
      }
      return winnerIndex;
    }, 0);
  }
}

class CacheSet {
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

class Cache {
  constructor(cacheBlocks, blockSize, replacementPolicy, readPolicy, mainMemoryBlocks = 1024) {
    this.mainMemoryBlocks = mainMemoryBlocks;
    this.cacheBlocks = cacheBlocks;
    this.blockSize = blockSize;
    this.ways = 8;
    this.setCount = cacheBlocks / this.ways;
    this.replacementPolicy = replacementPolicy;
    this.readPolicy = readPolicy;
    this.sets = Array.from({ length: this.setCount }, (_, index) => new CacheSet(index, this.ways, this.replacementPolicy));
    this.mainMemory = Array.from({ length: this.mainMemoryBlocks }, (_, blockNumber) => new MemoryBlock(blockNumber, this.blockSize));
  }

  reset() {
    this.sets = Array.from({ length: this.setCount }, (_, index) => new CacheSet(index, this.ways, this.replacementPolicy));
    this.mainMemory = Array.from({ length: this.mainMemoryBlocks }, (_, blockNumber) => new MemoryBlock(blockNumber, this.blockSize));
  }

  resetHighlights() {
    this.sets.forEach((set) => set.lines.forEach((line) => line.resetHighlight()));
  }

  getSetForBlock(blockNumber) {
    return this.sets[blockNumber % this.setCount];
  }

  getTagForBlock(blockNumber) {
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
      matchingLine.touch(accessTime);
      matchingLine.highlight = "hit";
      result.hit = true;
      result.miss = false;
      return result;
    }

    const victimIndex = set.getVictimIndex();
    const victimLine = set.lines[victimIndex];
    result.victim = victimLine.valid ? victimLine.blockNumber : null;
    result.replaced = victimLine.valid;

    if (this.readPolicy === "load-through") {
      const block = this.mainMemory[blockNumber];
      victimLine.load(block, tag, accessTime);
      victimLine.highlight = "replacement";
      result.insertedWay = victimIndex;
    } else {
      result.insertedWay = null;
    }

    return result;
  }
}

class Statistics {
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

class Logger {
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

class Simulator {
  constructor(config) {
    this.config = config;
    this.cache = new Cache(
      config.cacheBlocks,
      config.blockSize,
      config.replacementPolicy,
      config.readPolicy,
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
      return [...ascending, ...extended, ...extended, ...descending, ...extendedDescending, ...extendedDescending];
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

  async runSimulation(animationMode = "final") {
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

class Visualizer {
  constructor(cacheVisualization, traceLog, statsGrid, comparisonTable, comparisonCharts, sequencePreview) {
    this.cacheVisualization = cacheVisualization;
    this.traceLog = traceLog;
    this.statsGrid = statsGrid;
    this.comparisonTable = comparisonTable;
    this.comparisonCharts = comparisonCharts;
    this.sequencePreview = sequencePreview;
  }

  renderCache(cache) {
    this.cacheVisualization.innerHTML = "";

    cache.sets.forEach((set) => {
      const setCard = document.createElement("section");
      setCard.className = "set-card";

      const title = document.createElement("div");
      title.className = "set-title";
      title.textContent = `Set ${set.setId}`;
      setCard.appendChild(title);

      set.lines.forEach((line) => {
        const wayCard = document.createElement("article");
        wayCard.className = `way-card ${line.highlight}`;
        wayCard.innerHTML = `
          <strong>Way ${line.lineId}</strong>
          <div>Valid: ${line.valid ? "Yes" : "No"}</div>
          <div>Tag: ${line.valid ? line.tag : "-"}</div>
          <div>Block: ${line.valid ? line.blockNumber : "-"}</div>
          <div>Data: ${line.valid ? line.dataWords.slice(0, 3).join(", ") : "Empty"}</div>
          <div class="way-meta">Last Access: ${line.lastAccessTime || "-"}</div>
        `;
        setCard.appendChild(wayCard);
      });

      this.cacheVisualization.appendChild(setCard);
    });
  }

  renderStats(statistics) {
    this.statsGrid.innerHTML = "";
    const items = [
      { label: "Total Accesses", value: statistics.totalAccesses },
      { label: "Hits", value: statistics.hits },
      { label: "Misses", value: statistics.misses },
      { label: "Hit Rate", value: `${statistics.getHitRate().toFixed(2)}%` },
      { label: "Miss Rate", value: `${statistics.getMissRate().toFixed(2)}%` },
      { label: "AMAT", value: `${statistics.getAmat().toFixed(2)} ns` },
      { label: "Total Time", value: `${statistics.totalTime} ns` },
    ];

    items.forEach((item) => {
      const card = document.createElement("div");
      card.className = "stat-card";
      card.innerHTML = `<div class="stat-label">${item.label}</div><div class="stat-value">${item.value}</div>`;
      this.statsGrid.appendChild(card);
    });
  }

  renderTrace(logger) {
    this.traceLog.textContent = logger.toText();
  }

  renderSequencePreview(sequence) {
    const preview = sequence.slice(0, 20).join(", ");
    this.sequencePreview.textContent = `Preview: ${preview}${sequence.length > 20 ? "…" : ""}`;
  }

  renderComparison(results) {
    this.comparisonTable.innerHTML = "";
    const table = document.createElement("table");
    table.innerHTML = `
      <thead>
        <tr>
          <th>Metric</th>
          <th>LRU</th>
          <th>MRU</th>
        </tr>
      </thead>
      <tbody>
        <tr><td>Hits</td><td>${results.lru.statistics.hits}</td><td>${results.mru.statistics.hits}</td></tr>
        <tr><td>Misses</td><td>${results.lru.statistics.misses}</td><td>${results.mru.statistics.misses}</td></tr>
        <tr><td>Hit Rate</td><td>${results.lru.statistics.getHitRate().toFixed(2)}%</td><td>${results.mru.statistics.getHitRate().toFixed(2)}%</td></tr>
        <tr><td>Miss Rate</td><td>${results.lru.statistics.getMissRate().toFixed(2)}%</td><td>${results.mru.statistics.getMissRate().toFixed(2)}%</td></tr>
        <tr><td>AMAT</td><td>${results.lru.statistics.getAmat().toFixed(2)} ns</td><td>${results.mru.statistics.getAmat().toFixed(2)} ns</td></tr>
        <tr><td>Total Time</td><td>${results.lru.statistics.totalTime} ns</td><td>${results.mru.statistics.totalTime} ns</td></tr>
      </tbody>
    `;
    this.comparisonTable.appendChild(table);

    this.comparisonCharts.innerHTML = "";
    const chartData = [
      { title: "Hit Rate", lru: results.lru.statistics.getHitRate(), mru: results.mru.statistics.getHitRate() },
      { title: "Miss Rate", lru: results.lru.statistics.getMissRate(), mru: results.mru.statistics.getMissRate() },
      { title: "AMAT", lru: results.lru.statistics.getAmat(), mru: results.mru.statistics.getAmat() },
    ];

    chartData.forEach((card) => {
      const wrapper = document.createElement("div");
      wrapper.className = "chart-card";
      wrapper.innerHTML = `<h3>${card.title}</h3><div class="chart-bars"></div>`;
      const chartBars = wrapper.querySelector(".chart-bars");
      [
        { label: "LRU", value: card.lru },
        { label: "MRU", value: card.mru },
      ].forEach((bar) => {
        const barWrapper = document.createElement("div");
        barWrapper.className = "bar-wrapper";
        const barElement = document.createElement("div");
        barElement.className = "bar";
        const maxValue = Math.max(...chartData.flatMap((item) => [item.lru, item.mru]));
        const normalizedHeight = Math.max(18, (bar.value / Math.max(maxValue, 1)) * 100);
        barElement.style.height = `${normalizedHeight}%`;
        barElement.innerHTML = `<span class="bar-value">${bar.value.toFixed(2)}</span>`;
        barWrapper.appendChild(barElement);
        const label = document.createElement("div");
        label.className = "bar-label";
        label.textContent = bar.label;
        barWrapper.appendChild(label);
        chartBars.appendChild(barWrapper);
      });
      this.comparisonCharts.appendChild(wrapper);
    });
  }
}

class App {
  constructor() {
    this.cacheBlocksInput = document.getElementById("cacheBlocks");
    this.blockSizeInput = document.getElementById("blockSize");
    this.replacementPolicySelect = document.getElementById("replacementPolicy");
    this.readPolicySelect = document.getElementById("readPolicy");
    this.testCaseSelect = document.getElementById("testCase");
    this.randomSeedInput = document.getElementById("randomSeed");
    this.animationModeSelect = document.getElementById("animationMode");
    this.cacheAccessTimeInput = document.getElementById("cacheAccessTime");
    this.mainMemoryAccessTimeInput = document.getElementById("mainMemoryAccessTime");
    this.runButton = document.getElementById("runButton");
    this.compareButton = document.getElementById("compareButton");
    this.generateButton = document.getElementById("generateButton");
    this.resetButton = document.getElementById("resetButton");
    this.exportButton = document.getElementById("exportButton");
    this.messageBox = document.getElementById("messageBox");

    this.visualizer = new Visualizer(
      document.getElementById("cacheVisualization"),
      document.getElementById("traceLog"),
      document.getElementById("statsGrid"),
      document.getElementById("comparisonTable"),
      document.getElementById("comparisonCharts"),
      document.getElementById("sequencePreview"),
    );

    this.currentSimulator = null;
    this.currentTrace = "";
    this.bindEvents();
    this.updateMessage("Ready to simulate.");
    this.generatePreview();
  }

  bindEvents() {
    this.runButton.addEventListener("click", () => this.handleRun());
    this.compareButton.addEventListener("click", () => this.handleCompare());
    this.generateButton.addEventListener("click", () => this.generatePreview());
    this.resetButton.addEventListener("click", () => this.handleReset());
    this.exportButton.addEventListener("click", () => this.exportTrace());
  }

  updateMessage(message) {
    this.messageBox.textContent = message;
  }

  getConfig() {
    const cacheBlocks = this.normalizeCacheBlocks(Number(this.cacheBlocksInput.value));
    const blockSize = this.normalizeBlockSize(Number(this.blockSizeInput.value));
    const replacementPolicy = this.replacementPolicySelect.value === "mru" ? new MRUPolicy() : new LRUPolicy();
    const readPolicy = this.readPolicySelect.value;
    const testCase = this.testCaseSelect.value;
    const randomSeed = Number(this.randomSeedInput.value);
    const animationMode = this.animationModeSelect.value;
    const cacheAccessTime = Number(this.cacheAccessTimeInput.value) || 1;
    const mainMemoryAccessTime = Number(this.mainMemoryAccessTimeInput.value) || 100;

    return {
      cacheBlocks,
      blockSize,
      replacementPolicy,
      readPolicy,
      testCase,
      randomSeed,
      animationMode,
      cacheAccessTime,
      mainMemoryAccessTime,
    };
  }

  normalizeCacheBlocks(value) {
    if (!Number.isFinite(value) || value < 8) {
      return 16;
    }
    const powerOfTwo = this.nextPowerOfTwo(value);
    return powerOfTwo >= 8 ? powerOfTwo : 8;
  }

  normalizeBlockSize(value) {
    if (!Number.isFinite(value) || value < 2) {
      return 4;
    }
    return this.nextPowerOfTwo(value);
  }

  nextPowerOfTwo(value) {
    let nextValue = 1;
    while (nextValue < value) {
      nextValue *= 2;
    }
    return nextValue;
  }

  async handleRun() {
    const config = this.getConfig();
    this.currentSimulator = new Simulator(config);
    this.updateMessage(`Running ${config.testCase} with ${config.replacementPolicy.name} and ${config.readPolicy}.`);

    const result = await this.currentSimulator.runSimulation(config.animationMode);
    this.visualizer.renderCache(result.cache);
    this.visualizer.renderStats(result.statistics);
    this.visualizer.renderTrace(result.logger);
    this.visualizer.renderSequencePreview(result.sequence);
    this.currentTrace = result.logger.toText();
    this.updateMessage(`Simulation complete. ${result.statistics.hits} hits and ${result.statistics.misses} misses.`);
  }

  async handleCompare() {
    const config = this.getConfig();
    const lruConfig = { ...config, replacementPolicy: new LRUPolicy() };
    const mruConfig = { ...config, replacementPolicy: new MRUPolicy() };

    const lruSimulator = new Simulator(lruConfig);
    const mruSimulator = new Simulator(mruConfig);

    const lruResult = await lruSimulator.runSimulation("final");
    const mruResult = await mruSimulator.runSimulation("final");

    this.visualizer.renderCache(mruResult.cache);
    this.visualizer.renderStats(mruResult.statistics);
    this.visualizer.renderTrace(mruResult.logger);
    this.visualizer.renderSequencePreview(mruResult.sequence);
    this.visualizer.renderComparison({ lru: lruResult, mru: mruResult });
    this.currentTrace = mruResult.logger.toText();
    this.updateMessage("Comparison complete. Review the table and charts below.");
  }

  generatePreview() {
    const config = this.getConfig();
    const simulator = new Simulator(config);
    const sequence = simulator.generateSequence();
    this.visualizer.renderSequencePreview(sequence);
  }

  handleReset() {
    this.cacheBlocksInput.value = "16";
    this.blockSizeInput.value = "4";
    this.replacementPolicySelect.value = "lru";
    this.readPolicySelect.value = "load-through";
    this.testCaseSelect.value = "sequential";
    this.randomSeedInput.value = "42";
    this.animationModeSelect.value = "final";
    this.cacheAccessTimeInput.value = "1";
    this.mainMemoryAccessTimeInput.value = "100";
    this.visualizer.renderCache(new Cache(16, 4, new LRUPolicy(), "load-through"));
    this.visualizer.renderStats(new Statistics(1, 100));
    this.visualizer.renderTrace(new Logger());
    this.visualizer.renderSequencePreview([]);
    this.visualizer.renderComparison({ lru: { statistics: new Statistics(1, 100) }, mru: { statistics: new Statistics(1, 100) } });
    this.updateMessage("Reset complete.");
  }

  exportTrace() {
    const blob = new Blob([this.currentTrace || "No trace available."], { type: "text/plain;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = "cache-trace.txt";
    link.click();
    URL.revokeObjectURL(url);
  }
}

window.addEventListener("DOMContentLoaded", () => {
  new App();
});
*/
