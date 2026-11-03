

import json, os, urllib.request
url = "http://localhost:9100/api/"
query = "query($f:String,$s:ID,$v:ID,$n:Int) {getTestByADMandScenario(admQueryStr:$f,scenarioID:$s,admName:$v,alignmentTarget:null,evalNumber:$n)}"
cases = (
    ("normal-miss", "history.parameters.adm_name", "definitely-not-anadm"),
    ("where-false", "$where", "return false"),
    ("where-true", "$where", "return true"),
    ("where-error", "$where", 'throw new Error("ITM_WHERE_CANARY_20261021")'),
)
for label, field, value in cases:
    payload = {"query": query, "variables": {"f": field, "s": "June2026-AF-SS-observe", "v": value, "n": 17}}
    request = urllib.request.Request(
    url,
    data=json.dumps(payload).encode(),
    headers={"Content-Type": "application/json", "User-Agent": "Mozilla/5.0", "Authorization": "Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJkYXRhIjp7InRva2VuIjoiZDYyYzVjOTRjYThlZTdjYTQwM2Q5YTY2NDNiMmVlYjM4YmQxYTIwODkzYjdmZThmZDkwZDljNWY1YWUxZWJmMzkzYWNlYTBmNWRjZTE1ZTNlOTc4ZGEiLCJpc0ltcGVyc29uYXRlZCI6ZmFsc2UsInVzZXJJZCI6IjY5M2FkYTcwNjQ5NTJiNGVhY2Q0MGEzZSJ9LCJpYXQiOjE3OTMzOTIwMTgsImV4cCI6MTc5MzM5NzQxOH0.hwFQWmTd0Nybmb-2IDvzGcSYHCVLz979b2uyhHcK25I"},
 )
    with urllib.request.urlopen(request, timeout=30) as response:
        result = json.loads(response.read())
    record = result.get("data", {}).get("getTestByADMandScenario")
    errors = result.get("errors", [])
    canary = any("ITM_WHERE_CANARY_20261021" in item.get("message", "") for item in errors)
    print(f"{label}: result={'record' if record is not None else 'null'} errors={len(errors)} canary={str(canary).lower()}")
