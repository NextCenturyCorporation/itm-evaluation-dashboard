import requests
import time
API_URL = "http://localhost:9100/api" 
TOTAL_REQUESTS = 500  
QUERY = "{ getCurrentSurveyVersion }"

def test_rate_limiter():
    print(f"Testing rate limiter with {TOTAL_REQUESTS} requests")
    start_time = time.time()
    
    success_count = 0
    rate_limited_count = 0
    error_count = 0
    
    for i in range(TOTAL_REQUESTS):
        request_num = i + 1
        request_start = time.time()
        
        try:
            response = requests.post(
                API_URL,
                json={"query": QUERY},
                headers={"Content-Type": "application/json"}
            )
            
            elapsed = time.time() - request_start
            
            # testing the headers
            limit = response.headers.get('X-RateLimit-Limit', 'N/A')
            remaining = response.headers.get('X-RateLimit-Remaining', 'N/A')
            reset = response.headers.get('X-RateLimit-Reset', 'N/A')
            
            print(f"Request {request_num:3d}: status={response.status_code}, remaining={remaining:3s}, reset={reset:3s}, time={elapsed:.3f}s")
            
            if response.status_code == 200:
                success_count += 1
            elif response.status_code == 429:
                rate_limited_count += 1
            else:
                error_count += 1
                
        except Exception as e:
            print(f"Request {request_num:3d}: ERROR - {str(e)}")
            error_count += 1
    
    total_time = time.time() - start_time
    
    print("\nTest Summary:")
    print(f"Total Requests: {TOTAL_REQUESTS}")
    print(f"Successful (200): {success_count}")
    print(f"Rate Limited (429): {rate_limited_count}")
    print(f"Errors: {error_count}")
    print(f"Total time: {total_time:.2f} seconds")

if __name__ == "__main__":
    test_rate_limiter()