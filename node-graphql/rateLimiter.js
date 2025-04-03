const { GraphQLError } = require('graphql');

const RATE_LIMIT_WINDOW = 60 * 1000; // 1 minute 
// max requests, maybe change to 500?
const RATE_LIMIT_MAX_REQUESTS = 100; 
// 5 min reset
const RATE_LIMIT_CLEANUP_INTERVAL = 5 * 60 * 1000;

const rateLimitStore = {
    requestCounts: new Map(),
    ipTimestamps: new Map(),
    
    recordRequest(ip) {
        const now = Date.now();
        
        if (!this.ipTimestamps.has(ip)) {
            this.ipTimestamps.set(ip, []);
        }
        
        const timestamps = this.ipTimestamps.get(ip);
        
        timestamps.push(now);
        
        // dont hold onto requests outside the 5 min reset window
        const windowStart = now - RATE_LIMIT_WINDOW;
        const recentTimestamps = timestamps.filter(timestamp => timestamp > windowStart);
        
        this.ipTimestamps.set(ip, recentTimestamps);
        this.requestCounts.set(ip, recentTimestamps.length);
        
        return recentTimestamps.length;
    },
    
    getRequestCount(ip) {
        return this.requestCounts.get(ip) || 0;
    },
    
    cleanup() {
        const now = Date.now();
        const windowStart = now - RATE_LIMIT_WINDOW;
        
        for (const [ip, timestamps] of this.ipTimestamps.entries()) {
            const recentTimestamps = timestamps.filter(timestamp => timestamp > windowStart);
            
            if (recentTimestamps.length === 0) {
                this.ipTimestamps.delete(ip);
                this.requestCounts.delete(ip);
            } else {
                this.ipTimestamps.set(ip, recentTimestamps);
                this.requestCounts.set(ip, recentTimestamps.length);
            }
        }
    }
};

setInterval(() => {
    rateLimitStore.cleanup();
}, RATE_LIMIT_CLEANUP_INTERVAL);

function rateLimit(req) {
    // grabs reqip
    const ip = req.headers['x-forwarded-for'] || req.connection.remoteAddress;
    const requestCount = rateLimitStore.recordRequest(ip);
    
    if (requestCount > RATE_LIMIT_MAX_REQUESTS) {
        throw new GraphQLError('You are doing that too much!', {
            extensions: {
                code: 'RATE_LIMIT_EXCEEDED',
                http: { status: 429 }
            }
        });
    }
    
    // debug
    return {
        ip,
        requestCount,
        limit: RATE_LIMIT_MAX_REQUESTS,
        remaining: Math.max(0, RATE_LIMIT_MAX_REQUESTS - requestCount)
    };
}

module.exports = { rateLimit };