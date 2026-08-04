/**
 * UI rendering and app controller.
 */
import { Cache } from "./models.js";
import { Logger, Simulator, Statistics, createDefaultPolicy } from "./simulator.js";
import { LRUPolicy, MRUPolicy } from "./policies.js";

export class Visualizer {
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
      { label: "Total memory access count", value: statistics.totalAccesses },
      { label: "Cache hit count", value: statistics.hits },
      { label: "Cache miss count", value: statistics.misses },
      { label: "Cache hit rate", value: `${statistics.getHitRate().toFixed(2)}%` },
      { label: "Cache miss rate", value: `${statistics.getMissRate().toFixed(2)}%` },
      { label: "Average Memory Access Time", value: `${statistics.getAmat().toFixed(2)} ns` },
      { label: "Total memory access time", value: `${statistics.totalTime} ns` },
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
      const maxValue = Math.max(...chartData.flatMap((item) => [item.lru, item.mru]));
      [
        { label: "LRU", value: card.lru },
        { label: "MRU", value: card.mru },
      ].forEach((bar) => {
        const barWrapper = document.createElement("div");
        barWrapper.className = "bar-wrapper";
        const barElement = document.createElement("div");
        barElement.className = "bar";
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

export class App {
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
    const replacementPolicy = createDefaultPolicy(this.replacementPolicySelect.value);
    const readPolicy = this.readPolicySelect.value;
    const testCase = this.testCaseSelect.value;
    const randomSeed = Number(this.randomSeedInput.value);
    const animationMode = this.animationModeSelect.value;
    const ways = 8;
    const cacheAccessTime = Number(this.cacheAccessTimeInput.value) || 1;
    const mainMemoryAccessTime = Number(this.mainMemoryAccessTimeInput.value) || 100;

    return {
      cacheBlocks,
      blockSize,
      replacementPolicy,
      readPolicy,
      testCase,
      ways,
      randomSeed,
      animationMode,
      cacheAccessTime,
      mainMemoryAccessTime,
    };
  }

  normalizeCacheBlocks(value) {
    // minimum of 4 blocks and round up to the next power of 2
    if (!Number.isFinite(value) || value < 4) {
      return 16;
    }
    return this.nextPowerOfTwo(value);
  }

  normalizeBlockSize(value) {
    // minimum of 2 words and round up to the next power of 2
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

    const onStep = config.animationMode === "step" ? ({ cache, statistics, logger }) => {
      this.visualizer.renderCache(cache);
      this.visualizer.renderStats(statistics);
      this.visualizer.renderTrace(logger);
    } : null;

    const result = await this.currentSimulator.runSimulation(config.animationMode, onStep);
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

    const onStep = config.animationMode === "step" ? ({ cache, statistics, logger }) => {
      this.visualizer.renderCache(cache);
      this.visualizer.renderStats(statistics);
      this.visualizer.renderTrace(logger);
    } : null;

    const lruResult = await lruSimulator.runSimulation(config.animationMode === "step" ? "step" : "final", onStep);
    const mruResult = await mruSimulator.runSimulation(config.animationMode === "step" ? "step" : "final", onStep);

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
    this.visualizer.renderCache(new Cache(16, 4, new LRUPolicy(), "load-through", 8));
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
