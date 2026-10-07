# Publication safety — P1A engine only

Status: implementation for CTO review; publication QA and activation pending.
No production publication inventory or signing authority is established here.

`public/` remains source/development content. The future publication output is
`dist/hosting/`. Firebase still uses its existing configuration: P1A does not
activate this boundary in deployment, change workflows, or remove live pages.
Gas Metering remains preserved and must not be integrated or published.

## Owner rule

Development content is denied publication by default. Technical acceptance,
Git preservation, merge/PR permission, noindex, catalog omission and obscure URLs
are not publication authorization. Public preview channels count as publication.
Development QA remains localhost. No new authentication is introduced.

## Manifest

`publication/manifest.schema.json` is the strict P1A schema. Every property is
required; unknown properties and duplicate JSON keys are rejected. Every source
file must be classified exactly once as an approved exact file or an excluded
file with a reason. No inclusion globs are supported. Excluded files are not
hashed and can change during development; new files require classification.
The empty example uses a zero commit as a visibly synthetic fixture marker. It
is not a production inventory and will fail against a nonempty public tree.

Approved files carry SHA-256 and byte size; changed bytes at an approved path
fail. `reviewedSourceCommit` records the reviewed 40-character Git identity as
provenance, not an assertion that the builder has authenticated Git history.
The engine does not resolve or fetch that commit. Exact hashes govern copying.
Output preserves source-relative paths with no transforms or normalization.

`dependencies` lists exact static source paths. `dynamicDependencies` explicitly
lists runtime-loaded local files. Both must refer to approved files. The engine
validates declared closure; it does not discover all HTML/CSS/JavaScript URLs,
prove declarations complete, or inspect remote APIs. Undeclared runtime behavior
requires later review and browser/network QA before any production inventory is
approved. Routes map to approved files under the existing clean-URL convention.

Gas Metering-named path segments, `_template` and `ai` routes/files are denied by
the engine regardless of manifest inclusion. Renamed/copied content cannot be
identified semantically by a filename rule; exact owner review remains necessary.
All dedicated Gas Metering source files/assets must be classified excluded in a
future inventory. No such inventory is created by P1A.

## Approval verification

The canonical manifest uses recursively sorted object keys, preserved array order
and JSON scalar encoding. SHA-256 hashes its UTF-8 canonical bytes. The signed
payload is exactly `{schemaVersion:1, policy:"INSTMATES-PUBLICATION-v1",
manifestSha256:<digest>, audience:"PUBLIC"}` in the same canonical encoding.
The approval object has exactly `payload` and `signature`; signature is canonical
base64 of a 64-byte Ed25519 signature. The verifier requires an Ed25519 public key.
Manifest changes, wrong keys, malformed signatures and absent required approval
fail closed. Tests generate ephemeral test keys in memory; no keys are persisted.

CLI usage (only after a future authorized inventory/key decision):

```
node scripts/build-publication.mjs ROOT MANIFEST APPROVAL_JSON PUBLIC_KEY_PEM
```

CLI always requires approval. The exported API's `approvalRequired:false` exists
for unsigned local fixture validation only; its audit records
`publicationAuthorized:false`. Never deploy that output. A supplied public key
is a caller trust input, not proof of owner identity. Production key pinning,
custody, CI authority, revocation and deployment-action authorization remain
outside P1A. Signing does not authorize a deployment action by itself.

## Filesystem and output

The builder rejects unsafe paths, symlinks, special files, duplicate/case-colliding
classifications and source names. It checks ancestor paths before cleanup. It
invalidates old output, stage and audit before manifest/approval validation;
then copies captured approved buffers into an empty stage, rehashes every output,
checks exact inventory, and promotes the stage by rename. The deterministic audit
is `dist/publication-audit.json`, outside the served artifact. No timestamps are
included. A failed build removes its stage, output and report. An aborted process
before promotion can leave a stage, but no previous output; the next run removes
that stage. A process killed after successful promotion has completed its byte
validation, but deployment still needs an independently verified audit/approval.

Run only one builder per root and do not concurrently mutate the source/output
filesystem. This local engine does not claim protection against hostile concurrent
filesystem writers or administrators who can change the verifier/configuration.
Unsafe symlink destinations are refused rather than followed or deleted.

## Local QA and later activation

Run `npm --prefix site-tests test`, `node scripts/build-hub.mjs --check`, syntax
checks and whitespace checks. Tests use temporary directories outside the source
checkout. Existing source development and browser harnesses remain unchanged.

P1B must separately establish an owner-reviewed initial inventory; trusted approval
key; production/preview/manual deployment gates; clean-URL and rewrite validation;
service-worker/cache removal; artifact browser QA; and rollback rules. Existing
public content is not automatically approved. `_template` and `/ai/` must be absent
from future artifacts but remain live until a separately authorized deployment.
Firebase credentials can bypass repository hooks; stronger IAM controls require
separate authorization. No deployment command is invoked by this engine.
