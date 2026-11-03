import json
import urllib.request
URL = "http://localhost:9100/api/"
PID = '202507101'

def gql(query, variables=None):
    payload = {"query": query}
    if variables is not None:
        payload["variables"] = variables
    request = urllib.request.Request(
        URL,
        data=json.dumps(payload).encode(),
        headers={"Content-Type": "application/json", "User-Agent":
        "Mozilla/5.0"},
    )
    with urllib.request.urlopen(request, timeout=60) as response:
        return response.status, json.loads(response.read())

def show(name, data):
    if data.get('errors'):
        print(f"{name}: REFUSED -> {data['errors'][0]['message']}")
    else:
        print(f"{name}: RETURNED DATA -> {json.dumps(data['data'])[:200]}")

status, data = gql("{ getParticipantLog }")
show("getParticipantLog (no login)", data)

status, result = gql(
    "mutation($pid:String!,$updates:JSON){ updateParticipantLog(pid:$pid,updates:$updates) }",
    {
    "pid": PID,
    "updates": {"claimed": True},
    },
)
show("updateParticipantLog (no login)", result)