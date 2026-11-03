API=http://localhost:9100/api/

curl -s -X POST "$API" \
    -H "Content-Type: application/json" \
    -d '{"query":"mutation { createUser(user: { username: \"test_invalid\", email: \"t@t.t\", password: \"Pass123!\", admin: true }) { userId } }"}' 
echo 
curl -s -X POST "$API" \
    -H "Content-Type: application/json" \
    -d '{"query":"mutation { createUser(user: { username: \"test_invalid\", email: \"t@t.t\", password: \"Pass123!\", approved: true }) { userId }}"}' 
echo