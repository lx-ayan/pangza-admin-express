/** Redisson 风格可重入锁：成功返回 null，失败返回剩余 TTL(ms) */
export const LOCK_ACQUIRE_LUA = `
if (redis.call('exists', KEYS[1]) == 0) then
  redis.call('hincrby', KEYS[1], ARGV[2], 1);
  redis.call('pexpire', KEYS[1], ARGV[1]);
  return nil;
end;
if (redis.call('hexists', KEYS[1], ARGV[2]) == 1) then
  redis.call('hincrby', KEYS[1], ARGV[2], 1);
  redis.call('pexpire', KEYS[1], ARGV[1]);
  return nil;
end;
return redis.call('pttl', KEYS[1]);
`.trim();

/** 看门狗续期 */
export const LOCK_RENEW_LUA = `
if (redis.call('hexists', KEYS[1], ARGV[2]) == 1) then
  redis.call('pexpire', KEYS[1], ARGV[1]);
  return 1;
end;
return 0;
`.trim();

/**
 * 解锁：ARGV[1]=unlock message, ARGV[2]=leaseMs, ARGV[3]=field
 * 返回 nil=非持有者；0=重入减一；1=完全释放并 publish
 */
export const LOCK_UNLOCK_LUA = `
if (redis.call('hexists', KEYS[1], ARGV[3]) == 0) then
  return nil;
end;
local counter = redis.call('hincrby', KEYS[1], ARGV[3], -1);
if (counter > 0) then
  redis.call('pexpire', KEYS[1], ARGV[2]);
  return 0;
else
  redis.call('del', KEYS[1]);
  redis.call('publish', KEYS[2], ARGV[1]);
  return 1;
end;
`.trim();

export const LOCK_FORCE_UNLOCK_LUA = `
if (redis.call('del', KEYS[1]) == 1) then
  redis.call('publish', KEYS[2], ARGV[1]);
  return 1;
end;
return 0;
`.trim();

/** 公平锁：队列头才可获取 */
export const FAIR_LOCK_ACQUIRE_LUA = `
while (true) do
  local first = redis.call('lindex', KEYS[2], 0);
  if first == false then
    break;
  end;
  if redis.call('exists', KEYS[3] .. first) == 0 then
    redis.call('lpop', KEYS[2]);
  else
    break;
  end;
end;
if (redis.call('exists', KEYS[1]) == 0) then
  local first = redis.call('lindex', KEYS[2], 0);
  if first == false or first == ARGV[2] then
    redis.call('hincrby', KEYS[1], ARGV[2], 1);
    redis.call('pexpire', KEYS[1], ARGV[1]);
    if first == ARGV[2] then
      redis.call('lpop', KEYS[2]);
    end;
    redis.call('del', KEYS[3] .. ARGV[2]);
    return nil;
  end;
end;
if (redis.call('hexists', KEYS[1], ARGV[2]) == 1) then
  redis.call('hincrby', KEYS[1], ARGV[2], 1);
  redis.call('pexpire', KEYS[1], ARGV[1]);
  return nil;
end;
if (redis.call('exists', KEYS[3] .. ARGV[2]) == 0) then
  redis.call('rpush', KEYS[2], ARGV[2]);
  redis.call('set', KEYS[3] .. ARGV[2], 1, 'px', ARGV[3]);
end;
return redis.call('pttl', KEYS[1]);
`.trim();

/** 读锁：无写锁时共享 */
export const READ_LOCK_ACQUIRE_LUA = `
local mode = redis.call('hget', KEYS[1], 'mode');
if (mode == false) then
  redis.call('hset', KEYS[1], 'mode', 'read');
  redis.call('hset', KEYS[1], ARGV[2], 1);
  redis.call('hset', KEYS[1], 'r:' .. ARGV[2], 1);
  redis.call('pexpire', KEYS[1], ARGV[1]);
  return nil;
end;
if (mode == 'read') then
  local ind = redis.call('hget', KEYS[1], 'r:' .. ARGV[2]);
  local c = redis.call('hincrby', KEYS[1], ARGV[2], 1);
  if (c == 1) then
    redis.call('hset', KEYS[1], 'r:' .. ARGV[2], 1);
  end;
  redis.call('pexpire', KEYS[1], ARGV[1]);
  return nil;
end;
return redis.call('pttl', KEYS[1]);
`.trim();

export const READ_LOCK_UNLOCK_LUA = `
local mode = redis.call('hget', KEYS[1], 'mode');
if (mode == false) then
  return 1;
end;
local c = redis.call('hincrby', KEYS[1], ARGV[2], -1);
if (c == 0) then
  redis.call('hdel', KEYS[1], ARGV[2]);
  redis.call('hdel', KEYS[1], 'r:' .. ARGV[2]);
end;
local remain = 0;
local t = redis.call('hgetall', KEYS[1]);
for i = 1, #t, 2 do
  if string.sub(t[i], 1, 2) == 'r:' then
    remain = remain + 1;
  end;
end;
if (remain == 0) then
  redis.call('del', KEYS[1]);
  redis.call('publish', KEYS[2], ARGV[1]);
  return 1;
end;
redis.call('pexpire', KEYS[1], ARGV[3]);
return 0;
`.trim();

/** 写锁：独占 */
export const WRITE_LOCK_ACQUIRE_LUA = `
local mode = redis.call('hget', KEYS[1], 'mode');
if (mode == false) then
  redis.call('hset', KEYS[1], 'mode', 'write');
  redis.call('hset', KEYS[1], ARGV[2], 1);
  redis.call('pexpire', KEYS[1], ARGV[1]);
  return nil;
end;
if (mode == 'write') then
  if (redis.call('hexists', KEYS[1], ARGV[2]) == 1) then
    redis.call('hincrby', KEYS[1], ARGV[2], 1);
    redis.call('pexpire', KEYS[1], ARGV[1]);
    return nil;
  end;
end;
return redis.call('pttl', KEYS[1]);
`.trim();

export const WRITE_LOCK_UNLOCK_LUA = `
local mode = redis.call('hget', KEYS[1], 'mode');
if (mode ~= 'write') then
  return nil;
end;
if (redis.call('hexists', KEYS[1], ARGV[2]) == 0) then
  return nil;
end;
local c = redis.call('hincrby', KEYS[1], ARGV[2], -1);
if (c > 0) then
  redis.call('pexpire', KEYS[1], ARGV[3]);
  return 0;
end;
redis.call('del', KEYS[1]);
redis.call('publish', KEYS[2], ARGV[1]);
return 1;
`.trim();

export const SEMAPHORE_TRY_ACQUIRE_LUA = `
local available = tonumber(redis.call('get', KEYS[1]) or ARGV[1]);
if available == nil then
  available = tonumber(ARGV[1]);
  redis.call('set', KEYS[1], available);
end;
local permits = tonumber(ARGV[2]);
if available >= permits then
  redis.call('set', KEYS[1], available - permits);
  return 1;
end;
return 0;
`.trim();

export const SEMAPHORE_RELEASE_LUA = `
local available = tonumber(redis.call('get', KEYS[1]) or '0');
redis.call('set', KEYS[1], available + tonumber(ARGV[1]));
redis.call('publish', KEYS[2], '1');
return available + tonumber(ARGV[1]);
`.trim();

export const COUNTDOWN_COUNTDOWN_LUA = `
local v = redis.call('decr', KEYS[1]);
if v <= 0 then
  redis.call('del', KEYS[1]);
  redis.call('publish', KEYS[2], '0');
  return 0;
end;
return v;
`.trim();
