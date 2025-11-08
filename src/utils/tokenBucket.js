const calculateTokens = (lastRefillTime, refillRate, currentTokens, capacity) => {
    const currentTime = Date.now();
    const elapsedTime = Math.max(0, currentTime - lastRefillTime);
    const tokensToAdd = refillRate * elapsedTime;
    return Math.min(capacity, currentTokens + tokensToAdd);
};


const canAllowRequest = (currentTokens) => {
    return currentTokens >= 1;
}

const consumeTokens = (currentTokens) => {
    return Math.max(0, currentTokens - 1);
}


class TokenBucket {
    constructor(capacity, refillRate) {
        this.capacity = capacity;
        this.refillRate = refillRate / 60 / 1000;
        this.lastRefill = Date.now();
        this.tokens = capacity;
    }

    refill() {
        this.tokens = calculateTokens(
            this.lastRefill,
            this.refillRate,
            this.tokens,
            this.capacity
        );
        this.lastRefill = Date.now();
    }

    allowRequest() {
        this.refill();
        if (canAllowRequest(this.tokens)) {
            this.tokens = consumeTokens(this.tokens)
            return true;
        }
        return false;
    }


}

module.exports = {
    TokenBucket,
    consumeTokens,
    calculateTokens,
    canAllowRequest
}