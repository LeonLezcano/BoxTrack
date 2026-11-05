# Graph Report - .  (2026-11-05)

## Corpus Check
- cluster-only mode — file stats not available

## Summary
- 144 nodes · 257 edges · 8 communities (6 shown, 2 thin omitted)
- Extraction: 100% EXTRACTED · 0% INFERRED · 0% AMBIGUOUS
- Token cost: 0 input · 0 output

## Community Hubs (Navigation)
- Community 0
- Community 1
- Community 2
- Community 3
- Community 4
- Community 5
- Community 6
- Community 7

## God Nodes (most connected - your core abstractions)
1. `BoxTrackApp` - 24 edges
2. `BoxTrackCacheService` - 13 edges
3. `Sanitizer` - 9 edges
4. `MoveOrderService` - 7 edges
5. `Formatters` - 7 edges
6. `DamagePreInspectionEngine` - 6 edges
7. `VolumeCalculator` - 6 edges
8. `getStorageItem()` - 6 edges
9. `scripts` - 5 edges
10. `setStorageItem()` - 5 edges

## Surprising Connections (you probably didn't know these)
- None detected - all connections are within the same source files.

## Import Cycles
- None detected.

## Communities (8 total, 2 thin omitted)

### Community 0 - "Community 0"
Cohesion: 0.04
Nodes (48): badgeBlocked, badgeDelivered, badgeTransit, cachedMoves, cleanRisk, csvOutput, customItems, damageItem (+40 more)

### Community 1 - "Community 1"
Cohesion: 0.12
Nodes (8): DAMAGE_TYPES, DamagePreInspectionEngine, ITEM_CUBIC_STANDARDS, VEHICLE_FLEET, VolumeCalculator, ExportService, MoveOrderService, CryptoSeal

### Community 2 - "Community 2"
Cohesion: 0.21
Nodes (3): BoxTrackApp, Formatters, Sanitizer

### Community 3 - "Community 3"
Cohesion: 0.24
Nodes (5): BoxTrackCacheService, getStorageItem(), memoryStore, removeStorageItem(), setStorageItem()

### Community 4 - "Community 4"
Cohesion: 0.17
Nodes (11): author, description, license, name, scripts, security:full, test, test:security (+3 more)

### Community 5 - "Community 5"
Cohesion: 0.31
Nodes (3): STORAGE_UNITS_CATALOG, StorageDunningSentinel, StorageContractService

## Knowledge Gaps
- **60 isolated node(s):** `name`, `version`, `description`, `type`, `test` (+55 more)
  These have ≤1 connection - possible missing edges or undocumented components.
- **2 thin communities (<3 nodes) omitted from report** — run `graphify query` to explore isolated nodes.

## Suggested Questions
_Questions this graph is uniquely positioned to answer:_

- **Why does `BoxTrackCacheService` connect `Community 3` to `Community 0`, `Community 1`?**
  _High betweenness centrality (0.114) - this node is a cross-community bridge._
- **Why does `BoxTrackApp` connect `Community 2` to `Community 1`, `Community 5`?**
  _High betweenness centrality (0.095) - this node is a cross-community bridge._
- **Why does `ExportService` connect `Community 1` to `Community 0`, `Community 2`?**
  _High betweenness centrality (0.062) - this node is a cross-community bridge._
- **What connects `name`, `version`, `description` to the rest of the system?**
  _60 weakly-connected nodes found - possible documentation gaps or missing edges._
- **Should `Community 0` be split into smaller, more focused modules?**
  _Cohesion score 0.0392156862745098 - nodes in this community are weakly interconnected._
- **Should `Community 1` be split into smaller, more focused modules?**
  _Cohesion score 0.12333333333333334 - nodes in this community are weakly interconnected._