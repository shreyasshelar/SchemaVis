package com.schemavis.config;

import io.github.bucket4j.Bandwidth;
import io.github.bucket4j.Bucket;
import io.github.bucket4j.Refill;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Component;

import java.time.Duration;
import java.util.Map;
import java.util.concurrent.ConcurrentHashMap;

/**
 * Token-bucket rate limiter keyed by client IP.
 *
 * Why Bucket4j?  It is the de-facto standard for in-process rate limiting in
 * Spring applications, is thread-safe, and requires zero external infra.
 * When we move to multi-instance, swap the ConcurrentHashMap for a Redis-backed
 * ProxyManager with one dependency change.
 */
@Component
public class RateLimitConfig {

    private final int requestsPerMinute;
    private final Map<String, Bucket> buckets = new ConcurrentHashMap<>();

    public RateLimitConfig(@Value("${rate-limit.requests-per-minute:20}") int requestsPerMinute) {
        this.requestsPerMinute = requestsPerMinute;
    }

    /**
     * Returns true if the IP is allowed to proceed; false if the bucket is empty.
     */
    public boolean tryConsume(String clientIp) {
        return buckets.computeIfAbsent(clientIp, this::newBucket).tryConsume(1);
    }

    private Bucket newBucket(String ip) {
        Bandwidth limit = Bandwidth.classic(
                requestsPerMinute,
                Refill.intervally(requestsPerMinute, Duration.ofMinutes(1))
        );
        return Bucket.builder().addLimit(limit).build();
    }
}
