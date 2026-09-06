/*
 * InstMates website – Cloud Functions
 *
 * W0: the only function that used to live here, restoreProfiles, was an
 * HTTPS endpoint invokable by anyone (Cloud Run invoker: allUsers) that
 * listed every Auth user and wrote profile documents. Owner/CTO direction
 * (W0 gate, item 9) is to DELETE the deployed function and keep the
 * recovery logic as a local Admin SDK script:
 *
 *   scripts/admin/restore-profiles.mjs   (dry-run by default, --apply to write)
 *
 * Deploying this (empty) module with `firebase deploy --only functions`
 * prompts to delete restoreProfiles from the project. No functions are
 * exported on purpose.
 */
