import { randomBytes, randomUUID } from "crypto";
import jwt from "jsonwebtoken";
import type { LoginId, ResolvedAuthOptions, TokenStyle } from "./types";

/** Sa-Token 风格的随机 token 生成 */
export function generateStyleToken(style: TokenStyle): string {
  switch (style) {
    case "simple-uuid":
      return randomUUID().replace(/-/g, "");
    case "uuid":
      return randomUUID();
    case "random-32":
      return randomBytes(16).toString("hex");
    case "random-64":
      return randomBytes(32).toString("hex");
    case "random-128":
      return randomBytes(64).toString("hex");
    case "tik": {
      // 类 Sa-Token tik：短可读风格
      const part = () => randomBytes(3).toString("hex");
      return `${part()}_${part()}_${part()}`;
    }
    case "jwt":
      // jwt 由 createAuthToken 用密钥签发，这里不应单独走到
      return randomUUID();
    default:
      return randomUUID();
  }
}

export interface CreateTokenPayload {
  loginId: LoginId;
  device?: string;
  /** 会话超时 ms；-1 永不过期 */
  timeout: number;
}

/**
 * 按配置生成 token（自定义 createToken > jwt > tokenStyle）。
 */
export async function createAuthToken(
  options: ResolvedAuthOptions,
  payload: CreateTokenPayload
): Promise<string> {
  if (options.createToken) {
    return await options.createToken({
      loginId: payload.loginId,
      device: payload.device,
    });
  }

  if (options.tokenStyle === "jwt") {
    const expiresIn =
      payload.timeout < 0
        ? undefined
        : Math.max(1, Math.ceil(payload.timeout / 1000));
    const signOptions: jwt.SignOptions = {
      algorithm: (options.jwtAlgorithm || "HS256") as jwt.Algorithm,
    };
    if (expiresIn !== undefined) {
      signOptions.expiresIn = expiresIn;
    }
    return jwt.sign(
      {
        loginId: payload.loginId,
        device: payload.device,
      },
      options.jwtSecret,
      signOptions
    );
  }

  return generateStyleToken(options.tokenStyle);
}

/** 校验 JWT 形态 token（非 jwt 风格直接 true） */
export function verifyAuthToken(
  options: ResolvedAuthOptions,
  token: string
): boolean {
  if (options.tokenStyle !== "jwt" && !options.createToken) {
    return true;
  }
  if (options.tokenStyle !== "jwt") {
    return true;
  }
  try {
    jwt.verify(token, options.jwtSecret, {
      algorithms: [(options.jwtAlgorithm || "HS256") as jwt.Algorithm],
    });
    return true;
  } catch {
    return false;
  }
}
