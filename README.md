# Machine 9 Cache Memory Simulator

## Project Overview

This project implements a web-based simulator for Machine 9, an 8-way set associative cache memory system. It compares the behavior of two replacement policies, Least Recently Used (LRU) and Most Recently Used (MRU), using the same memory access patterns. The simulator is built with modular, object-oriented JavaScript and includes a visual cache display, step-by-step or final-view execution modes, a detailed trace log, and summary statistics.

## Machine Specifications

- Main memory: 1024 memory blocks
- Cache organization: 8-way set associative
- Cache line contents: valid bit, tag, block number, data words, and replacement metadata
- Supported replacement policies: LRU and MRU
- Supported read policies: non-load-through and load-through

## Configurable Parameters

Users can configure:

- Number of cache blocks
- Block size (in words)
- Replacement policy
- Read policy
- Test case selection
- Random seed for reproducibility
- Cache and main memory access times

## Cache Organization

The simulator uses the standard set-associative mapping formula:

- Number of sets = total cache blocks / 8
- Set index = memory block number mod number of sets
- Tag = memory block number / number of sets

When a set is full, the selected replacement policy determines which line is evicted.

## Replacement Algorithms

### Least Recently Used (LRU)

LRU replaces the line that has gone the longest without being accessed.

### Most Recently Used (MRU)

MRU replaces the line that was accessed most recently.

## Read Policies

- Non-load-through: the simulator does not populate the cache line with the block data during a miss.
- Load-through: the simulator loads the accessed block into the cache on a miss.

## Screenshots

Placeholder section for screenshots and demo images.

## How to Run

1. Open the project folder in a browser.
2. Launch index.html directly or use a local static server.
3. Configure the parameters.
4. Run a simulation or compare LRU and MRU.

## Project Structure

- index.html – application shell and UI layout
- styles.css – visual styling and responsive layout
- app.js – simulator engine, policies, visualization, and controls
- docs/sample-output.txt – sample statistics output
- docs/sample-trace-log.txt – sample trace log

## Analysis of Test Case A

Test Case A uses a sequential access pattern that repeats from 0 to $2n - 1$ twice, where $n$ is the total number of cache blocks. This pattern is useful for observing how a cache behaves when memory is accessed in a linear, predictable order.

## Analysis of Test Case B

Test Case B uses a mixed access pattern involving forward and backward traversals with repeated ranges. It is helpful for observing how the chosen replacement policy behaves under more complex locality.

## Analysis of Test Case C

Test Case C generates 64 random accesses between 0 and 1023. This case is useful for measuring average performance under a more irregular access distribution.

## Comparison between LRU and MRU

In general:

- LRU tends to perform better when recent access history is a good predictor of future access.
- MRU may perform better for access patterns that repeatedly revisit a small set of recently used blocks.

## Observed Advantages

- LRU is often intuitive and predictable.
- MRU can outperform LRU in some repeated-access patterns.
- The simulator makes these differences easy to inspect visually.

## Observed Disadvantages

- MRU may evict blocks that are still likely to be reused soon.
- LRU can be less effective when access patterns are less sequential and more bursty.

## Conclusion

The simulator provides a practical and educational way to explore 8-way set associative cache behavior. It demonstrates how cache organization, replacement policy, and access patterns affect hit rate, miss rate, AMAT, and total memory access time.
