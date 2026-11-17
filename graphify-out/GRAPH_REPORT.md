# Graph Report - c:\Users\Regondi Calidad\Desktop\QM\BoxTrack  (2026-11-17)

## Corpus Check
- Corpus is ~16,137 words - fits in a single context window. You may not need a graph.

## Summary
- 179 nodes · 351 edges · 12 communities (9 shown, 3 thin omitted)
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
- Community 8
- Community 9

## God Nodes (most connected - your core abstractions)
1. `BoxTrackApp` - 36 edges
2. `BoxTrackCacheService` - 15 edges
3. `Sanitizer` - 9 edges
4. `MoveOrderService` - 7 edges
5. `Formatters` - 7 edges
6. `DamagePreInspectionEngine` - 6 edges
7. `VolumeCalculator` - 6 edges
8. `getStorageItem()` - 6 edges
9. `setStorageItem()` - 6 edges
10. `scripts` - 5 edges

## Surprising Connections (you probably didn't know these)
- None detected - all connections are within the same source files.

## Import Cycles
- None detected.

## Communities (12 total, 3 thin omitted)

### Community 0 - "Community 0"
Cohesion: 0.04
Nodes (50): badgeBlocked, badgeDelivered, badgeTransit, cachedMoves, cleanRisk, csvOutput, customItems, damageItem (+42 more)

### Community 1 - "Community 1"
Cohesion: 0.16
Nodes (3): BoxTrackApp, Formatters, Sanitizer

### Community 2 - "Community 2"
Cohesion: 0.22
Nodes (6): BoxTrackCacheService, getStorageItem(), memoryStore, removeStorageItem(), safeJsonParse(), setStorageItem()

### Community 3 - "Community 3"
Cohesion: 0.15
Nodes (7): STORAGE_UNITS_CATALOG, StorageDunningSentinel, ALLOWED_PHOTO_TYPES, SVG_ICONS, ExportService, StorageContractService, WhatsAppBoxNotifierService

### Community 4 - "Community 4"
Cohesion: 0.15
Nodes (5): DAMAGE_TYPES, DamagePreInspectionEngine, VolumeCalculator, MoveOrderService, CryptoSeal

### Community 5 - "Community 5"
Cohesion: 0.17
Nodes (11): background_color, description, display, icons, lang, name, orientation, scope (+3 more)

### Community 6 - "Community 6"
Cohesion: 0.17
Nodes (11): author, description, license, name, scripts, security:full, test, test:security (+3 more)

## Knowledge Gaps
- **75 isolated node(s):** `name`, `short_name`, `description`, `start_url`, `scope` (+70 more)
  These have ≤1 connection - possible missing edges or undocumented components.
- **3 thin communities (<3 nodes) omitted from report** — run `graphify query` to explore isolated nodes.

## Suggested Questions
_Questions this graph is uniquely positioned to answer:_

- **Why does `BoxTrackApp` connect `Community 1` to `Community 2`, `Community 3`?**
  _High betweenness centrality (0.123) - this node is a cross-community bridge._
- **Why does `BoxTrackCacheService` connect `Community 2` to `Community 0`, `Community 1`, `Community 3`?**
  _High betweenness centrality (0.094) - this node is a cross-community bridge._
- **Why does `ExportService` connect `Community 3` to `Community 0`, `Community 1`?**
  _High betweenness centrality (0.049) - this node is a cross-community bridge._
- **What connects `name`, `short_name`, `description` to the rest of the system?**
  _75 weakly-connected nodes found - possible documentation gaps or missing edges._
- **Should `Community 0` be split into smaller, more focused modules?**
  _Cohesion score 0.038461538461538464 - nodes in this community are weakly interconnected._