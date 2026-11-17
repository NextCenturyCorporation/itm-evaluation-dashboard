#!/bin/bash

cd "$(dirname "$0")"

ADEPT_PORT=8080

cat > adept-allowlist-test.conf <<EOF
events {}

http {
    server {
        listen 80;

        location /adept/ {
            if (\$uri !~ ^/adept/api/v1/(new_session|response|computed_kdma_profile|get_ordered_alignment|subpopulation)$) {
                return 404;
            }
            proxy_pass http://host.docker.internal:$ADEPT_PORT/;
        }

        location /adept_phase1/ {
            if (\$uri !~ ^/adept_phase1/api/v1/(new_session|response|computed_kdma_profile|get_ordered_alignment|subpopulation)$) {
                return 404;
            }
            proxy_pass http://host.docker.internal:$ADEPT_PORT/;
        }
    }
}
EOF

CONF="$(pwd -W 2>/dev/null || pwd)/adept-allowlist-test.conf"
docker run --rm -d --name adept-test -p 8088:80 --add-host=host.docker.internal:host-gateway \
    -v "$CONF:/etc/nginx/nginx.conf:ro" nginx:latest > /dev/null
sleep 2

failed=0

check() {
    expected=$1
    method=$2
    url=$3
    actual=$(curl -s -o /dev/null -w '%{http_code}' -X "$method" "$url")
    if [ "$actual" = "$expected" ]; then
        echo "PASS $actual $method $url"
    else
        echo "FAIL $actual $method $url (expected $expected)"
        failed=1
    fi
}

echo "DIRECTLY to ADEPT:"
check 200 GET http://localhost:$ADEPT_PORT/api/v1/alignment_target_ids
check 200 GET http://localhost:$ADEPT_PORT/openapi.json

echo
echo "Through nginx:"
check 404 GET http://localhost:8088/adept/api/v1/alignment_target_ids
check 404 GET http://localhost:8088/adept/openapi.json
check 404 POST http://localhost:8088/adept/api/v1/reset
check 404 POST http://localhost:8088/adept/api/v1/save
check 404 GET http://localhost:8088/adept_phase1/api/v1/alignment_target_ids

if [ "$1" = "--keep" ]; then
    echo
    echo "nginx left running on http://localhost:8088 for text scenario test"
    echo "Stop it afterwards with: docker stop adept-test"
else
    docker stop adept-test > /dev/null
fi
rm adept-allowlist-test.conf

if [ "$failed" = 1 ]; then
    echo
    echo "Some checks failed"
    exit 1
fi
echo
echo "All checks passed"