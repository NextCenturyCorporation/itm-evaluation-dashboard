const RATE_LIMIT_WINDOW = 60 * 1000;
// 300 seems sufficiently high that no honest user would ever come close
const RATE_LIMIT = 300;
// clear memory after 5 mins
const RATE_LIMIT_CLEANUP_INTERVAL = 5 * 60 * 1000;

const rateLimitStore = {
    // ipAddress to count, timestamps, lastRequest
    users: new Map(),

    recordRequest(ip) {
        const now = Date.now();
        const windowStart = now - RATE_LIMIT_WINDOW;

        if (!this.users.has(ip)) {
            this.users.set(ip, {
                count: 1,
                timestamps: [now],
                lastRequest: now
            });
            return {
                count: 1,
                limit: RATE_LIMIT,
                remaining: RATE_LIMIT - 1,
                reset: Math.ceil(RATE_LIMIT_WINDOW / 1000)
            };
        }

        const user = this.users.get(ip);
        // sliding window (remove hits from outside window)
        user.timestamps = user.timestamps.filter(ts => ts > windowStart);

        user.timestamps.push(now);
        user.count = user.timestamps.length;
        user.lastRequest = now;

        if (user.timestamps.length > Math.max(RATE_LIMIT, 100)) {
            user.timestamps = user.timestamps.slice(-Math.max(RATE_LIMIT, 100));
        }

        const oldestTimestamp = Math.min(...user.timestamps);
        const resetMs = Math.max(0, oldestTimestamp + RATE_LIMIT_WINDOW - now);
        const resetSeconds = Math.ceil(resetMs / 1000);

        // Update user in store
        this.users.set(ip, user);

        return {
            count: user.count,
            limit: RATE_LIMIT,
            remaining: Math.max(0, RATE_LIMIT - user.count),
            reset: resetSeconds
        };
    },

    // remove users who havent made recent requests from memory 
    cleanup() {
        const now = Date.now();
        const cutoff = now - (RATE_LIMIT_WINDOW * 2);

        for (const [key, user] of this.users.entries()) {
            if (user.lastRequest < cutoff) {
                this.users.delete(key);
            }
        }
    },
};

// save memory
setInterval(() => {
    rateLimitStore.cleanup();
}, RATE_LIMIT_CLEANUP_INTERVAL);

function rateLimit(req) {
    try {
        const ip = req.headers['x-forwarded-for'] ||
            req.connection.remoteAddress ||
            req.socket.remoteAddress ||
            req.ip ||
            '0.0.0.0';


        const rateLimitInfo = rateLimitStore.recordRequest(ip);


        if (rateLimitInfo.count > rateLimitInfo.limit) {
            // user is doing that too much! 
            console.warn(`Rate limit exceeded for IP ${ip}: ${rateLimitInfo.count}/${rateLimitInfo.limit} requests`);

            // gql error would not save custom error status or code for some reasons
            const error = new Error('Rate limit exceeded. Please try again later.');
            error.isRateLimit = true
            error.retryAfter = rateLimitInfo.reset;

            throw error;
        }

        // Will remove, for debugging only!
        console.log(`Rate limit for IP ${ip}: ${rateLimitInfo.count}/${rateLimitInfo.limit} requests`)

        return {
            success: true,
            ip,
            ...rateLimitInfo
        };
    } catch (error) {
        throw error;
    }
}

module.exports = {
    rateLimit
};