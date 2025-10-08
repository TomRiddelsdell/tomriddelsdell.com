# ADR-009: Event Replay Strategy — Hybrid (Event Store Authoritative + Kafka for Consumer Replay)

## Status

Accepted

## Context

The platform uses Event Sourcing with Neon Postgres (authoritative event store) and Kafka as the streaming bus. We need a robust, operationally safe approach for:

- Full projection rebuilds (correctness, reproducibility).
- Operational consumer catch-up and reprocessing (availability, throughput).
- Minimising coupling to Kafka retention policies while leveraging Kafka tooling where appropriate.

## Decision

Adopt a **hybrid replay strategy**:

1. **Event Store (Neon Postgres) is the authoritative source of truth** for full projection rebuilds and any operation requiring complete historical fidelity.
2. **Kafka** is the operational replay medium for consumer catch-up, high-throughput re-delivery, and ad-hoc reprocessing where topic retention guarantees are sufficient.
3. Provide tooling that supports both flows and enables republishing from the event store to Kafka when required.

## Rationale

- The event store contains the immutable, complete history required to deterministically rebuild projections and is not subject to Kafka retention/compaction constraints.
- Kafka offers mature replay tooling and high throughput for re-seeding downstream consumers, but it should not be relied on as the primary source for canonical replays.
- A hybrid approach gives the best of both: correctness (event store) and operational convenience & throughput (Kafka).

## Details

### A. Full Projection Rebuilds (Authoritative Path)

- Performed by **Replay Worker** processes that read events directly from Neon Postgres in strict order.
- Rebuilds should be executed against **isolated projection targets** (separate tables or schema) to avoid disrupting live reads.
- Upon successful rebuild, perform an atomic swap (rename tables or switch schema pointers) to make the new projection live.
- The replay worker supports:
  - Rebuild by bounded context, projection name, or time-range.
  - Checkpointing and resumability (store progress in a control table).
  - Throttling/batching to avoid overwhelming downstream DBs.
  - Dry-run and validation modes.

### B. Consumer Catch-up & High-Throughput Replays (Operational Path)

- For services that consume Kafka topics and miss messages (downtime, backpressure), use **Kafka replay tools** to re-stream messages from Kafka topics at appropriate offsets.
- Kafka-based replays are suitable for:
  - Short-to-medium window reprocessing where retention/compaction ensures data is available.
  - Non-authoritative consumers (search indexers, analytics, notifications) where eventual consistency is acceptable.
- Provide documented operational runbooks for common Kafka replay tasks (reset offsets, re-stream topic data, use kafka-replay-cli or equivalent).

### C. Republishing from Event Store to Kafka

- If a projection rebuild requires downstream consumers to be re-seeded (or Kafka retention no longer contains needed events), provide a **republish flow**:
  1. Read canonical events from Neon in order.
  2. Optionally transform/serialize to topic format (respecting Avro schemas and envelope).
  3. Publish into Kafka topics in the correct sequence with controlled throughput.
- Republishing can be integrated into the Replay Worker or exposed as a separate utility.

### D. Idempotency and Ordering Guarantees

- Consumers (and projection logic) **must be idempotent**; apply deduplication using `event_id` and/or `stream_id+version`.
- Ensure ordered processing per aggregate stream where required; global ordering is not guaranteed by design.
- When republishing to Kafka, preserve per-aggregate partitioning (partition by `aggregate_id`) to maintain ordering semantics for consumers that require it.

### E. Tooling & Infrastructure

- **Replay Worker** (primary tool):
  - Connects to Neon, streams events, applies projection logic into target DB.
  - Checkpointing table structure to store progress and resume safely.
  - Support for parallelism: rebuild by projection shard or by aggregate ID ranges.
- **Kafka Replay Utilities**:
  - Use existing community replay tools for operational replays; maintain runbooks and wrapper scripts to standardize usage.
- **Control & Orchestration**:
  - Provide orchestration commands (CLI / internal admin UI) to start/monitor replays, view checkpoints, and abort safely.
  - Emit audit events for replay operations (start, progress, finish, abort).

### F. Operational Safety

- Rebuilds run under a controlled environment (dedicated worker pool or maintenance namespace).
- Monitor replay throughput, DB load, and projection lag; implement throttling if needed.
- Provide pre-flight checks (disk space, DB indexes, consumer capacity) before large replays.
- Maintain a safe rollback plan: if swap fails, revert to previous projection and investigate.

## Consequences

- Requires building and maintaining a Replay Worker and republish tooling (custom development).
- Operational processes must be documented and exercised (runbooks, dry-runs).
- Additional infra for isolated rebuild targets and control tables will be necessary.
- Kafka alone is insufficient for authoritative rebuilds; reliance on Neon for correctness adds implementation responsibility.

## Next Steps

1. Scaffold a Replay Worker prototype that reads events from Neon and writes projections to a separate schema.
2. Implement checkpointing and resume logic, plus a control table for replay jobs.
3. Create a republish CLI that can read from Neon and publish to Kafka with partitioning by `aggregate_id`.
4. Add runbooks and monitoring dashboards (projection rebuild progress, checkpoint metrics, DB load).
5. Bake replay tests into CI (small historic replays on test data) to validate correctness.
