# Machine 9 Cache Memory Simulator
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

### Test Case A - Sequential

Accesses blocks from 0 to 2n - 1, then repeats the same sequence.

### Test Case B - Mid Repeat

Uses a forward and reverse access pattern with repeated ranges to stress the cache and replacement policy.

### Test Case C - Random

Generates 64 random block accesses in the range 0 to 1023.

## Project Structure

- [index.html](index.html) - application shell and controls
- [styles.css](styles.css) - visual styling and responsive layout
- [ui.js](ui.js) - UI wiring, events, and rendering
- [simulator.js](simulator.js) - simulation engine and test-sequence generation
- [models.js](models.js) - cache, set, and memory data structures
- [policies.js](policies.js) - LRU and MRU replacement policies

## Images/Screenshots

### Test Case A (16 blocks, 16 words)
<img width="1353" height="354" alt="image" src="https://github.com/user-attachments/assets/9432ec97-230f-4920-a64b-048a5b0b7123" />
<img width="1345" height="557" alt="image" src="https://github.com/user-attachments/assets/95ee54ce-5f0a-4de9-90fb-91f946116e29" />
<img width="1348" height="743" alt="image" src="https://github.com/user-attachments/assets/0117af7c-57d4-4c8c-8e4f-a40576d1a75c" />

---
### Test Case B (16 blocks, 16 words)
<img width="1350" height="342" alt="image" src="https://github.com/user-attachments/assets/618057c9-a4c7-4a21-acde-b805c1a2c869" />
<img width="1349" height="561" alt="image" src="https://github.com/user-attachments/assets/70df3275-2575-4204-96da-67a9b371da2b" />
<img width="1349" height="738" alt="image" src="https://github.com/user-attachments/assets/50c11b41-1f40-4f77-b8b3-cdb660d3a677" />

---
### Test Case C (16 blocks, 16 words)
<img width="1349" height="340" alt="image" src="https://github.com/user-attachments/assets/83827593-cc7b-409b-9257-e56904d77301" />
<img width="1346" height="564" alt="image" src="https://github.com/user-attachments/assets/86315317-09e0-46ed-a392-ae74a4d54719" />
<img width="1342" height="736" alt="image" src="https://github.com/user-attachments/assets/b8942173-5518-4062-9ab6-a0296c60f21f" />

---
## Notes

- The project focuses on Machine 9 only.
- The sample outcomes depend on the selected cache size, block size, access times, read policy, and random seed.
- Main memory size is fixed at 1024 blocks.
- The simulator is intended to support analysis, screenshots, and a walkthrough video for the project submission.
