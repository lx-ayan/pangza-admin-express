import fs from "fs";
import path from "path";
import { randomUUID } from "crypto";
import type { Request } from "express";
import { Component } from "@/framework/Service";
import { OrmError } from "@/framework/ORM";
import { UPLOAD_PATH, UPLOAD_URL_PREFIX } from "@/framework/config";

const BUCKET_PATTERN = /^[a-zA-Z0-9_-]+$/;

export interface FileUploadVO {
  name: string;
  type: string;
  data: string;
  size: number;
}

export interface UploadedFileLike {
  originalname?: string;
  mimetype?: string;
  size?: number;
  buffer?: Buffer;
}

@Component()
export default class FileService {
  /**
   * 上传文件到本地目录，返回可访问绝对 URL 列表
   */
  async upload(
    bucket: string,
    files: UploadedFileLike[],
    req: Request
  ): Promise<FileUploadVO[]> {
    if (!bucket?.trim() || !BUCKET_PATTERN.test(bucket.trim())) {
      throw new OrmError("桶名不合法，仅支持字母、数字、下划线和中划线");
    }
    const list = (files ?? []).filter((f) => f && f.buffer && f.buffer.length > 0);
    if (!list.length) {
      throw new OrmError("请选择要上传的文件");
    }

    const safeBucket = bucket.trim();
    const now = new Date();
    const yyyy = String(now.getFullYear());
    const MM = String(now.getMonth() + 1).padStart(2, "0");
    const dd = String(now.getDate()).padStart(2, "0");
    const datePath = `${yyyy}/${MM}/${dd}`;
    const relativeDir = `${safeBucket}/${datePath}`;
    const targetDir = path.join(UPLOAD_PATH, ...relativeDir.split("/"));

    fs.mkdirSync(targetDir, { recursive: true });

    const accessBase = this.buildAccessBase(req);
    const result: FileUploadVO[] = [];

    for (const file of list) {
      const originalName = file.originalname || "file";
      const ext = path.extname(originalName);
      const storedName = `${randomUUID().replace(/-/g, "")}${ext}`;
      const dest = path.join(targetDir, storedName);
      fs.writeFileSync(dest, file.buffer!);

      result.push({
        name: originalName,
        type: file.mimetype || "application/octet-stream",
        size: file.size ?? file.buffer!.length,
        data: `${accessBase}/${relativeDir}/${storedName}`,
      });
    }

    if (!result.length) {
      throw new OrmError("没有可上传的有效文件");
    }
    return result;
  }

  /** 例如 http://host:port/files */
  private buildAccessBase(req: Request): string {
    let prefix = UPLOAD_URL_PREFIX || "/files";
    if (!prefix.startsWith("/")) prefix = `/${prefix}`;
    if (prefix.endsWith("/")) prefix = prefix.slice(0, -1);
    return `${req.protocol}://${req.get("host")}${prefix}`;
  }
}
