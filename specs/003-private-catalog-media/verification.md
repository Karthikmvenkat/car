# Private media verification

## Consistency analysis before implementation
FR001/005->T003/T004/T007;FR002/003/004->T003/T004/T005;FR006->T005/T006;FR007->T006/T007;FR008->T003/T006/T008. All8 requirements and4 success criteria covered by8 tasks. No conflicting business requirements, unresolved design questions or constitution violations. Checklist16/16 complete; Spec Kit plan/tasks setup succeeded; actual branch remains codex/001-production-baseline. No hooks: extensions.yml absent. Plan research agent confirmed admission before buffering, real/static path isolation, per-photo rights and conservative uncertain-commit storage handling.

## Results
Verified2026-10-17 on codex/001-production-baseline:

| Check | Actual result |
|---|---|
| API/synthetic/request tests | 8 suites,428 passed,0 failed |
| Real PostgreSQL tests | 3 suites,31 passed,0 failed;11 media,14 catalog,6 foundation |
| API typecheck/build | Passed |
| Web typecheck | Passed |
| UI source baseline | All92 original files unchanged; no frontend additions |
| Prisma schema validation | Passed |
| Generated client | Fresh cache generation passed; installed engine matches checksum; schema metadata synchronized |
| Diff whitespace | Passed |
| Dependency resolution | API explicitly resolves Sharp0.35.5, already installed transitively; lockfile adds the direct dependency only |

Owned schema migrations applied only to fresh disposable localhost PostgreSQL. Schemas removed, fixture processes stopped and fixture password files removed; no live database used. Synthetic filesystem fixtures remain under ignored .cache. No real source, customer image, remote acquisition, production configuration, payment, deployment, commit or push performed. CI covers these suites through the existing workflow but has not run on GitHub.

### Evidence and behavioral limits
Processing tests verify actual Sharp output: JPEG EXIF orientation, sRGB WebP bounds/no enlargement, derivative metadata stripping, original/derivative checksums, corrupt/oversize/pixel-bomb/long-edge rejection, APNG and actual two-frame WebP rejection, deadline kill, abort handling and capacity recovery. Decoder runs in a child with application secrets omitted from its environment. Child timeout/heap flags are not a hard native RSS or OS security sandbox.

HTTP tests exercise actual JWT/current-role guards, multipart parsing and DTOs; all roles are checked for each route. Oversize/extra-field/forged-identity input is rejected before the service. Interceptor admission precedes multipart buffering. Busboy raises partsLimit at equality, so configured10 permits9 useful parts; independent8-field/1-file limits enforce the accepted maximum. Authenticated derivative and metadata responses use no-store; original route is absent. Client filenames never become paths.

Filesystem tests require explicit private configuration and reject public paths, traversal keys and junction aliases. Immutable sets use exclusive fixed filenames under randomUUID directories. Reads check size/hash and deny symlinks. Tampered derivatives fail closed. Database tests exercise actual files and rows: duplicate uploads leave one logical record/audit; forced-overlap final reviews leave one decision/audit; withdrawal/revocation/expiry block delivery/acceptance; exact identity and accepted fresh facts are mandatory. Permission and actor are rechecked after processing. Real audit rejection rolls back upload/review/withdrawal. A real partial filesystem write leaves no record. Simulated lost response after actual DB commit retains blobs and recovers the original result on retry. No legacy Vehicle is created.

### Local Prisma tool limitation
Standard generate updated client code/types but could not replace the engine DLL locked by an existing Windows process. No process was stopped. Generation into .cache/catalog-media-generation/client succeeded, its engine checksum matches the installed DLL, and generated schema metadata now matches the repository schema. Actual PostgreSQL tests verified the installed client's new models. Normal CI/clean installs generate before starting the runtime.

### Remaining production gates
The private local adapter requires explicit absolute CATALOG_MEDIA_ROOT and a persistent single-instance mount outside static roots. No runtime/environment was configured for actual uploads. Before production: choose durable shared object storage where needed; configure Windows ACLs/POSIX ownership, OS memory/process limits, ingress request deadlines/rate limits, storage quotas, backup/restore and conservative orphan reconciliation/retention. Two-process admission is per API instance, not a distributed quota. Partial/crash/duplicate/uncertain-commit blob sets are retained privately; automatic deletion is deliberately absent. Client abort is best-effort and cannot recall a commit already in progress or bytes already delivered.

No source connector, image discovery, cloud storage adapter, public CDN/publisher, frontend staff workflow or consumer attribution UI is implemented. Existing legacy public assets/publication paths have not been retroactively rights-verified; future integration must consolidate every publication path. Current eligibleForPublication remains a preparation signal, not a public endpoint. Actual source/asset permissions and identity require staff review. The existing Firebase deployment package is unchanged/unverified for subprocesses and persistent storage; do not deploy this local adapter onto ephemeral functions. Additive migration requires review/staging/backup gates before any existing environment.

Existing unrelated work remains preserved. Frontend lint debt from the foundation record (20 errors/21 warnings) remains outside this increment; lint was not rerun. No claim of full platform production readiness or legal compliance. All pre/post hooks skipped because extensions.yml is absent.
