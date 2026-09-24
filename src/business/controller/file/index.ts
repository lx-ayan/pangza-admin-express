import type { Request, Response } from "express";
import multer from "multer";
import Application, { BusinessType } from "@/framework/Application";
import { Container } from "@/framework/Service";
import { OrmError } from "@/framework/ORM";
import ResponseData from "@/framework/utils/entity/ResponseData";
import FileService from "@/business/service/file";

const upload = multer({ storage: multer.memoryStorage() });

function getFileService() {
  return Container.get(FileService);
}

/**
 * 文件上传 —— 函数式注册（multipart 需 raw + multer）
 * POST /api/file/upload  fields: bucket, files[]
 */
Application.POST(
  "/api/file/upload",
  async (req: Request, res: Response) => {
    await new Promise<void>((resolve, reject) => {
      upload.array("files")(req, res, (err) =>
        err ? reject(err) : resolve()
      );
    });

    const bucket = String((req.body as any)?.bucket ?? "");
    const files = ((req as any).files ?? []) as Express.Multer.File[];
    if (!files.length) {
      throw new OrmError("请选择要上传的文件");
    }

    const result = await getFileService().upload(bucket, files, req);
    res.send(ResponseData.success(result));
  },
  {
    auth: {},
    raw: true,
    log: { title: "上传文件", business: BusinessType.UPLOAD },
  }
);
