#!/bin/bash

set -o pipefail

REPO_DIR="/home/ec2-user/github/itm-evaluation-dashboard"
COMPOSE_FILE="docker_setup/tests/docker-compose-tests.yml"
COMPOSE_PROJECT="dashboard-ci-${BUILD_NUMBER:-manual}"
LOG_FILE="${REPO_DIR}/dashboard-test-run.log"

cleanup() {
    cd "${REPO_DIR}" || return

    docker-compose \
        -p "${COMPOSE_PROJECT}" \
        -f "${COMPOSE_FILE}" \
        down \
        --volumes \
        --remove-orphans || true
}

trap cleanup EXIT

cd "${REPO_DIR}" || exit 1

echo "Testing commit:"
git log -1 --oneline

rm -f "${LOG_FILE}"

docker-compose \
    -p "${COMPOSE_PROJECT}" \
    -f "${COMPOSE_FILE}" \
    down \
    --volumes \
    --remove-orphans || true

docker-compose \
    -p "${COMPOSE_PROJECT}" \
    -f "${COMPOSE_FILE}" \
    up \
    --abort-on-container-exit \
    --exit-code-from tests \
    --no-build \
    2>&1 | tee "${LOG_FILE}"

TEST_EXIT_CODE=${PIPESTATUS[0]}

echo
echo "================ TEST SUMMARY ================"

grep -E "Test Suites:|Tests:|Snapshots:|Time:|Ran all test suites" \
    "${LOG_FILE}" \
    | tail -n 5 \
    || true

echo
echo "Failed suites:"

grep -E "tests-1[[:space:]]+\| FAIL " "${LOG_FILE}" \
    | sed 's/^.*| //' \
    || true

echo

if [ "${TEST_EXIT_CODE}" -eq 0 ]; then
    echo "RESULT: ALL DASHBOARD TESTS PASSED"
else
    echo "RESULT: DASHBOARD TESTS FAILED"
fi

exit "${TEST_EXIT_CODE}"