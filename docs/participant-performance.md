# Participant reads and progress pagination

Participant login and PID lookup now request a single participant by hashed email
(and evaluation for login). Links with a PID request that participant directly.
The app no longer loads the participant log at startup. New participant entry
requests the next candidate PID from the server, then uses the existing assignment
and insertion flow, including its collision handling. The candidate query does
not reserve an ID.

The progress table uses `getParticipantProgress` with a phase, optional evaluation
numbers, participant types, completion filters, PID substring, and sort order.
The server applies these filters and sorting before offset/limit pagination.
The default page contains 50 participants; the UI offers 25, 50, or 100, and the
API caps requests at 200. Counts and filter options cover the whole selected
phase, not just the visible page.

Rows contain summary fields and compact scenario/alignment flags. Full text and
survey records load only when a participant's ADM or repair dialog opens.
Downloads explicitly fetch successive pages, so they include all matching rows.
"Download All Data" includes the selected phase; "Download Filtered Data" also
applies the current evaluation, type, completion, and PID filters.

Evaluation inference retains the existing priority: first simulator result,
latest completed survey, latest text result, participant-log evaluation, then
the legacy PID-range fallback. Related records use `_id` order for deterministic
first/last selection, with simulator records ordered by timestamp first. Existing
completion-filter thresholds remain unchanged, including their differences from
evaluation-specific cell highlighting.

## Deployment and validation

Deploy the GraphQL server with or before the UI because the UI uses new query
fields. Server startup creates participant lookup indexes on the text,
simulator, and both survey PID fields. Check startup logs for index errors and
allow index creation to finish before measuring performance. Existing unique
participant-ID and hashed-email/evaluation indexes support the entry queries.
No data migration is required.

Run `npm --prefix dashboard-ui run test:participants` after installing both
projects' dependencies. The tests start an isolated MongoDB instance (7.0.14,
downloaded on first use), without connecting to the configured dashboard database.
They cover targeted reads, mixed numeric/string PIDs, legacy evaluation inference,
completion filters, stable pagination, compact alignment parity, GraphQL
resolvers, UI navigation, lazy details, and exports across multiple pages.

The payload is bounded during browsing, but calculating totals and preserving
legacy evaluation inference still aggregates participant summaries on the server.
This change does not make database work constant-time. An isolated MongoDB 7 query
plan check with 200 participants used the added indexes for all three related
collections with zero collection scans. Production latency still needs to be
measured with representative data and the deployed MongoDB version.
