# Dashboard browser tests on Linux

From the repository root, run:

```bash
./docker_setup/tests/run-jenkins-tests.sh
```

The runner uses the existing `dashboard-tests:local` image. No image rebuild is
required for these script/configuration changes. It supports both `docker-compose`
and `docker compose`, and requires the host's `timeout` and `flock` commands.

Each run gets a unique Compose project and log, even when Jenkins does not forward
`BUILD_NUMBER` over SSH. `dashboard-test-run.log` also contains the latest container
output. Test execution is locked per checkout; disable concurrent Jenkins builds
as well, since the Jenkins checkout/pull commands happen before this script starts.

The remote test command has a 20-minute deadline, followed by bounded container
cleanup. Cleanup also runs on normal exit and interrupt/termination signals. To
change the deadline, set `TEST_RUN_TIMEOUT`, for example `TEST_RUN_TIMEOUT=15m`.

Dependencies are installed on the first run, or when package files, lockfiles,
project npm settings, or Node/npm versions change. The fingerprint is recorded
only after a successful install. Force a reinstall with:

```bash
TEST_REINSTALL_DEPS=1 ./docker_setup/tests/run-jenkins-tests.sh
```

The bind-mounted checkout retains npm, Jest, and webpack caches in `node_modules`.
This cache reuses the installed dependency tree; committed lockfiles would still
be needed to make fresh checkouts resolve exactly the same dependency versions.

The log includes Node, Chromium, and test-library versions, plus the start/end of
each browser/database cleanup step. Chromium stderr is forwarded in Docker. A
cleanup step has a 30-second limit and fails the suite if it cannot complete.

If a previous run was disconnected by Jenkins before cleanup, check for leftover
containers before retrying. For the old `dashboard-ci-manual` project only, once
you have confirmed it is no longer an active run:

```bash
docker-compose -p dashboard-ci-manual -f docker_setup/tests/docker-compose-tests.yml down --volumes --remove-orphans
```

For a focused diagnostic run inside the test container, use:

```bash
bash docker_setup/tests/run-container-tests.sh --runTestsByPath src/__tests__/CACIProlific.test.jsx
```
