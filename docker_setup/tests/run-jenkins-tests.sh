#!/bin/bash

set -uo pipefail

REPO_DIR="$(cd -- "$(dirname -- "${BASH_SOURCE[0]}")/../.." && pwd)" || exit 1
COMPOSE_FILE="docker_setup/tests/docker-compose-tests.yml"
RUN_ID="${BUILD_NUMBER:-$(date -u +%Y%m%dT%H%M%SZ)-$$}"
COMPOSE_PROJECT="dashboard-ci-${RUN_ID,,}"
LOG_FILE="${REPO_DIR}/dashboard-test-run.log"
RUN_LOG_FILE="${REPO_DIR}/dashboard-test-${RUN_ID}.log"
TEST_RUN_TIMEOUT="${TEST_RUN_TIMEOUT:-20m}"

cd "${REPO_DIR}" || exit 1
for required_command in timeout flock; do
    command -v "${required_command}" >/dev/null || {
        echo "Missing required command: ${required_command}"
        exit 1
    }
done

# The containers share this checkout and its dependency/cache directories.
exec 9> "${REPO_DIR}/.dashboard-tests.lock"
flock -n 9 || {
    echo "Another dashboard test run is using this checkout; refusing to overlap."
    exit 1
}

if command -v docker-compose >/dev/null; then
    COMPOSE=(docker-compose)
else
    COMPOSE=(docker compose)
fi
COMPOSE+=(-p "${COMPOSE_PROJECT}" -f "${COMPOSE_FILE}")

stream_test_output() {
    if [[ "${TEST_VERBOSE:-false}" == true ]]; then
        cat
        return
    fi
    # Keep the complete stream in the log files; show concise progress in Jenkins.
    awk '
        {
            gsub(/\033\[[0-9;]*[[:alpha:]]/, "")
            sub(/^[^|]*\|[[:space:]]?/, "")
            sub(/^[[:space:]]+/, "")
            if ($0 ~ /^\[test setup\]/ || $0 ~ /^Chromium [0-9]/ ||
                $0 ~ /^(PASS|FAIL) / || $0 ~ /^\[TEST DEBUG\]/ ||
                $0 ~ /^\[test cleanup\].*failed:/ ||
                $0 ~ /^(Jest did not exit|Error:|FATAL ERROR:)/) {
                print
                fflush()
            }
        }
    '
}

cleanup() {
    cd "${REPO_DIR}" || return

    timeout --signal=TERM --kill-after=10s 60s \
        "${COMPOSE[@]}" down \
        --volumes \
        --remove-orphans || true
}

trap cleanup EXIT
trap 'exit 130' INT
trap 'exit 143' TERM

echo "Testing commit:"
git log -1 --oneline
echo "[test runner] Project: ${COMPOSE_PROJECT}; deadline: ${TEST_RUN_TIMEOUT}"
echo "[test runner] Log: ${RUN_LOG_FILE}"

START_SECONDS=${SECONDS}
timeout --signal=TERM --kill-after=30s "${TEST_RUN_TIMEOUT}" \
    "${COMPOSE[@]}" up \
    --abort-on-container-exit \
    --exit-code-from tests \
    --no-build \
    2>&1 | tee "${LOG_FILE}" "${RUN_LOG_FILE}" | stream_test_output

PIPELINE_STATUS=("${PIPESTATUS[@]}")
TEST_EXIT_CODE=${PIPELINE_STATUS[0]}
if [[ ( "${PIPELINE_STATUS[1]}" -ne 0 || "${PIPELINE_STATUS[2]}" -ne 0 ) && "${TEST_EXIT_CODE}" -eq 0 ]]; then
    TEST_EXIT_CODE=1
fi
echo "[test runner] Finished after $((SECONDS - START_SECONDS)) seconds (exit ${TEST_EXIT_CODE})"

echo
echo "================ TEST SUMMARY ================"

grep -E "Test Suites:|Tests:|Snapshots:|Time:|Ran all test suites" \
    "${LOG_FILE}" \
    | tail -n 5 \
    | sed -E 's/^[^|]*\|[[:space:]]?//' \
    || true

echo
if [[ "${TEST_EXIT_CODE}" -eq 124 || "${TEST_EXIT_CODE}" -eq 137 ]]; then
    echo "RESULT: DASHBOARD TEST RUN EXCEEDED ${TEST_RUN_TIMEOUT}; cleaning up containers"
elif [ "${TEST_EXIT_CODE}" -eq 0 ]; then
    echo "RESULT: ALL DASHBOARD TESTS PASSED"
else
    echo "RESULT: DASHBOARD TESTS FAILED"
fi

if [[ "${TEST_EXIT_CODE}" -ne 0 && "${TEST_VERBOSE:-false}" != true ]]; then
    echo "Full output from the unsuccessful run (${RUN_LOG_FILE}):"
    cat "${RUN_LOG_FILE}"
fi

exit "${TEST_EXIT_CODE}"
