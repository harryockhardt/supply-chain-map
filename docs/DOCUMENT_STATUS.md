# Original project documents needed

Source conversation: Freitag Nachmittagsplan (6aa40ab1-af44-83ed-a9c8-bb6362793d3a).

The conversation was retrieved, but its generated file references contain no document contents and the attachment list is empty. No original documents were found in the local Codex workspace.

Supply the original README.md and the four documents PRODUCT.md, DATA_MODEL.md, ARCHITECTURE.md and ROADMAP.md, or the ZIP from that conversation. Copy the original README to the repository root and the remaining files into docs/ after checking them. Preserve local run instructions when incorporating the original README.

The conversation confirms the folder layout used here, but calls it approximate. Reconcile it with the original ARCHITECTURE.md before feature work. No missing document has been reconstructed and presented as an original.

Confirmed constraints to preserve during that review:

- v0.1 uses point incidents; retain PostGIS geometry in the eventual database design.
- Statuses: Upcoming, Active, Resolved, Unverified.
- Saved incidents are shared; normal users modify their own incidents, admins may modify all, enforced by database permissions.
- Incident deletion is soft deletion.
- Active, Upcoming and Resolved incidents require a source; Unverified may have none.
- No timeline, polygon drawing, edit suggestions, notifications, live ships/aircraft or AI ingestion in v0.1.

These notes are a handoff, not a replacement product specification. Resolve exact data requirements from the original files before database implementation.
