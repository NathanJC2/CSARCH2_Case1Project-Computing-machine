/**
 * Replacement policy implementations.
 * The cache logic can swap policies without changing the rest of the simulator.
 */
export class ReplacementPolicy {
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

export class LRUPolicy extends ReplacementPolicy {
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

export class MRUPolicy extends ReplacementPolicy {
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
