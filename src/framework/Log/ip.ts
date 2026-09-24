import type { Request } from "express";
import IP2Region from "ip2region";
import { getLogger } from "@/framework/Logger";

const log = getLogger("OperLog.IP");

let searcher: InstanceType<typeof IP2Region> | null = null;

function getSearcher(): InstanceType<typeof IP2Region> {
  if (!searcher) {
    // 包内自带库；关闭 IPv6 降低内存
    searcher = new IP2Region({ disableIpv6: true });
  }
  return searcher;
}

/** 是否内网 / 本机 */
export function isInternalIp(ip: string): boolean {
  const v = normalizeIp(ip);
  if (!v) return true;
  if (v === "127.0.0.1" || v === "localhost" || v === "0.0.0.0") return true;
  if (v.startsWith("10.")) return true;
  if (v.startsWith("192.168.")) return true;
  if (v.startsWith("169.254.")) return true;
  const m = v.match(/^172\.(\d+)\./);
  if (m) {
    const n = Number(m[1]);
    if (n >= 16 && n <= 31) return true;
  }
  return false;
}

/** 规范化：去掉 IPv6 映射前缀、方括号 */
export function normalizeIp(ip: string): string {
  let v = String(ip || "").trim();
  if (!v) return "";
  if (v.startsWith("[") && v.endsWith("]")) {
    v = v.slice(1, -1);
  }
  if (v.startsWith("::ffff:")) {
    v = v.slice(7);
  }
  if (v === "::1") return "127.0.0.1";
  // 去掉端口（极少见）
  if (/^\d+\.\d+\.\d+\.\d+:\d+$/.test(v)) {
    v = v.split(":")[0]!;
  }
  return v;
}

/**
 * 从请求解析客户端真实 IP（在请求生命周期内同步调用，勿等到连接关闭后）。
 */
export function getClientIp(req: Request): string {
  const candidates: unknown[] = [
    req.headers["x-forwarded-for"],
    req.headers["x-real-ip"],
    req.headers["cf-connecting-ip"],
    req.headers["x-client-ip"],
    (req as any).ip,
    req.socket?.remoteAddress,
    (req.connection as any)?.remoteAddress,
  ];

  for (const raw of candidates) {
    if (typeof raw === "string" && raw.trim()) {
      // x-forwarded-for: client, proxy1, proxy2
      const first = raw.split(",")[0]!.trim();
      const ip = normalizeIp(first);
      if (ip) return ip;
    }
    if (Array.isArray(raw) && raw.length > 0) {
      const ip = normalizeIp(String(raw[0]));
      if (ip) return ip;
    }
  }
  return "";
}

export interface IpRegionResult {
  country?: string;
  province?: string;
  city?: string;
  isp?: string;
}

/** 离线解析 IP 归属地（内网返回「内网IP」） */
export function resolveIpAddress(ip: string): string {
  const v = normalizeIp(ip);
  if (!v) return "";
  if (isInternalIp(v)) return "内网IP";

  try {
    const res = getSearcher().search(v) as IpRegionResult | null;
    if (!res) return "未知";
    const parts = [res.country, res.province, res.city, res.isp]
      .map((s) => String(s || "").trim())
      .filter((s) => s && s !== "0");
    // 去重：省市区可能重复
    const uniq: string[] = [];
    for (const p of parts) {
      if (!uniq.includes(p)) uniq.push(p);
    }
    return uniq.join(" ") || "未知";
  } catch (e) {
    log.warn({ err: e, ip: v }, "IP 归属地解析失败");
    return "未知";
  }
}
