import { Ratelimit } from '@upstash/ratelimit'
import { Redis } from '@upstash/redis'

const redis = new Redis({
  url: process.env.UPSTASH_REDIS_REST_URL!,
  token: process.env.UPSTASH_REDIS_REST_TOKEN!,
})

export const typingRatelimit = new Ratelimit({
  redis,
  limiter: Ratelimit.slidingWindow(30, '10 s'),
  prefix: 'rl:typing',
})

export const resultsRatelimit = new Ratelimit({
  redis,
  limiter: Ratelimit.slidingWindow(5, '60 s'),
  prefix: 'rl:results',
})

export const signupRatelimit = new Ratelimit({
  redis,
  limiter: Ratelimit.slidingWindow(5, '3600 s'),
  prefix: 'rl:signup',
})
