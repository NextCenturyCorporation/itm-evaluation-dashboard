#!/bin/bash

set -euo pipefail
cd /workspace

echo "[test setup] Node $(node --version), npm $(npm --version)"
"${PUPPETEER_EXECUTABLE_PATH:-chromium}" --version

dependency_fingerprint() {
    {
        node -p "process.version + ' ' + process.platform + ' ' + process.arch"
        npm --version
        for project in . dashboard-ui node-graphql; do
            for file in package.json package-lock.json .npmrc; do
                if [[ -f "${project}/${file}" ]]; then
                    sha256sum "${project}/${file}"
                fi
            done
        done
    } | sha256sum | cut -d ' ' -f 1
}

cache_marker=node_modules/.dashboard-test-dependencies
fingerprint=$(dependency_fingerprint)
if [[ "${TEST_REINSTALL_DEPS:-0}" == 1 ||
      ! -d dashboard-ui/node_modules || ! -d node-graphql/node_modules ||
      ! -f "${cache_marker}" || "$(cat "${cache_marker}")" != "${fingerprint}" ]]; then
    rm -f -- "${cache_marker}"
    echo "[test setup] Installing dependencies"
    npm run setup-tests
    # npm install can update lockfiles, so record the resulting dependency inputs.
    dependency_fingerprint > "${cache_marker}"
else
    echo "[test setup] Reusing dependencies (package files and Node/npm versions unchanged)"
fi

node -e "for (const name of ['jest', 'jest-puppeteer', 'puppeteer']) console.log('[test setup] ' + name + ' ' + require('./dashboard-ui/node_modules/' + name + '/package.json').version)"
if [[ "${TEST_VERBOSE:-false}" != true ]]; then
    exec npm --prefix ./dashboard-ui run test -- --verbose=false "$@"
fi
exec npm --prefix ./dashboard-ui run test -- "$@"
