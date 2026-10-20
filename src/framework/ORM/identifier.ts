import { randomBytes } from "crypto";
import { ormEnvConfig } from "@/framework/config";

/**
 * 主键生成器（对齐 MyBatis-Plus IdentifierGenerator）
 */
export interface IdentifierGenerator {
  /** 雪花 / 分布式 ID（ASSIGN_ID） */
  nextId(entity?: unknown): number | string | Promise<number | string>;
  /** UUID 字符串，默认去横线（ASSIGN_UUID） */
  nextUUID(entity?: unknown): string | Promise<string>;
}

/** 简易雪花：41bit 时间 + 10bit 机器 + 12bit 序列 */
class SnowflakeGenerator {
  private readonly epoch = 1704067200000n; // 2024-01-01
  private readonly workerId: bigint;
  private seq = 0n;
  private lastTs = -1n;

  constructor(workerId = 1) {
    this.workerId = BigInt(workerId & 0x3ff);
  }

  next(): bigint {
    let ts = BigInt(Date.now());
    if (ts === this.lastTs) {
      this.seq = (this.seq + 1n) & 0xfffn;
      if (this.seq === 0n) {
        while (ts <= this.lastTs) ts = BigInt(Date.now());
      }
    } else {
      this.seq = 0n;
    }
    this.lastTs = ts;
    return ((ts - this.epoch) << 22n) | (this.workerId << 12n) | this.seq;
  }
}

const snowflake = new SnowflakeGenerator(Number(ormEnvConfig.workerId) || 1);

export const defaultIdentifierGenerator: IdentifierGenerator = {
  nextId() {
    // 返回 string，避免 JS 大整数精度丢失；业务需要 number 时可自行 Number()
    return snowflake.next().toString();
  },
  nextUUID() {
    // 32 位无横线 hex（对齐 MyBatis-Plus ASSIGN_UUID）
    return randomBytes(16).toString("hex");
  },
};

let generator: IdentifierGenerator = defaultIdentifierGenerator;

/** 替换全局主键生成器 */
export function setIdentifierGenerator(next?: IdentifierGenerator): void {
  generator = next ?? defaultIdentifierGenerator;
}

export function getIdentifierGenerator(): IdentifierGenerator {
  return generator;
}
