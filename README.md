# Machine 9 Cache Memory Simulator

## Change Log

- Cache misses now always load the referenced block into the selected cache line, so the cache state and trace stay consistent on every miss.
- The mid-repeat test sequence now ends with the extended descending pattern twice, matching the intended access pattern.
- LRU and MRU now reuse a shared `findEmptyLine` helper in the parent replacement-policy class to remove duplicated empty-line checks.
- The README was updated to reflect the current Machine 9 scope, file structure, and simulator behavior.

## Project Overview

This project is a web-based simulator for Machine 9, an 8-way set-associative cache memory system. It compares Least Recently Used (LRU) and Most Recently Used (MRU) replacement behavior using the same access patterns. The simulator is built with modular JavaScript and provides a visual cache display, step-by-step or final snapshot execution, a detailed trace log, and summary statistics.

## Machine 9 Specifications

- Main memory size: 1024 blocks
- Cache organization: 8-way set associative
- Cache block count: configurable, minimum 4 blocks, power of 2
- Block size: configurable in words, minimum 2 words, power of 2
- Replacement policies: LRU and MRU
- Read policy selector: load-through and non-load-through
- Test cases: sequential, mid-repeat, and random
- Random seed support for reproducible runs
- Cache and main memory access time inputs
- Animation mode: final snapshot or step-by-step trace

## What the Simulator Shows

- Cache state visualization with valid bits, tags, block numbers, and replacement metadata
- Step-by-step trace or final cache snapshot
- Text trace log for every access
- Statistics for total accesses, hits, misses, hit rate, miss rate, AMAT, and total memory access time

## How the Cache Works

The simulator uses set-associative mapping with 8 ways per set.

- Number of sets = total cache blocks / 8
- Set index = block number mod number of sets
- Tag = block number / number of sets

When a set has no free line, the selected replacement policy determines the victim line.

## Replacement Policies

### Least Recently Used (LRU)

LRU evicts the line that has gone the longest without being accessed.

### Most Recently Used (MRU)

MRU evicts the line that was accessed most recently.

## Read Policy Behavior

- Load-through: the accessed block is inserted into cache on a miss.
- Non-load-through: the simulator still records the miss and populates the selected cache line so the cache visualization and trace remain synchronized with the current model.

## Test Cases

### Test A - Sequential

Accesses blocks from 0 to 2n - 1, then repeats the same sequence.

### Test B - Mid Repeat

Uses a forward and reverse access pattern with repeated ranges to stress the cache and replacement policy.

### Test C - Random

Generates 64 random block accesses in the range 0 to 1023.

## Sample Results

The sample output files in [docs/sample-output.txt](docs/sample-output.txt) and [docs/sample-trace-log.txt](docs/sample-trace-log.txt) show the expected reporting format.

## How to Run

1. Open the project folder in a browser or serve it with a local static server.
2. Open [index.html](index.html).
3. Configure the cache, policy, and test parameters.
4. Run a simulation, compare LRU vs MRU, or export the trace.

## Project Structure

- [index.html](index.html) - application shell and controls
- [styles.css](styles.css) - visual styling and responsive layout
- [ui.js](ui.js) - UI wiring, events, and rendering
- [simulator.js](simulator.js) - simulation engine and test-sequence generation
- [models.js](models.js) - cache, set, and memory data structures
- [policies.js](policies.js) - LRU and MRU replacement policies
- [docs/sample-output.txt](docs/sample-output.txt) - sample statistics output
- [docs/sample-trace-log.txt](docs/sample-trace-log.txt) - sample trace log

## Notes

- The project focuses on Machine 9 only.
- The sample outcomes depend on the selected cache size, block size, access times, read policy, and random seed.
- Main memory size is fixed at 1024 blocks.
- The simulator is intended to support analysis, screenshots, and a walkthrough video for the project submission.
