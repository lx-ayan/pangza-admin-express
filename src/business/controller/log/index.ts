import type { Request, Response } from "express";
import Application, { BusinessType, ParamType } from "@/framework/Application";
import { Container } from "@/framework/Service";
import SysLogService, {
  type SysLogPageForm,
} from "@/business/service/sysLog";
import type { PageRequest } from "@/framework/utils/entity/PageResult";

/**
 * 日志管理 —— 函数式注册（对齐 Java `/api/log`）
 * - POST /api/log/page
 * - GET  /api/log/export
 */

function getSysLogService() {
  return Container.get(SysLogService);
}

function escapeHtml(value: unknown): string {
  return String(value ?? "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

function formatTime(value: unknown): string {
  if (value == null || value === "") return "-";
  if (value instanceof Date) {
    const pad = (n: number) => String(n).padStart(2, "0");
    return `${value.getFullYear()}-${pad(value.getMonth() + 1)}-${pad(value.getDate())} ${pad(value.getHours())}:${pad(value.getMinutes())}:${pad(value.getSeconds())}`;
  }
  return String(value);
}

function buildExportHtml(rows: Record<string, unknown>[]): string {
  const headers = [
    "编号",
    "标题",
    "用户名",
    "头像",
    "控制器名称",
    "方法名称",
    "业务类型",
    "操作人",
    "请求参数",
    "状态",
    "耗时(毫秒)",
    "响应结果",
    "创建时间",
    "地址",
    "IP地址",
    "客户端标识",
    "请求地址",
    "错误信息",
  ];

  const head = headers.map((h) => `<th>${escapeHtml(h)}</th>`).join("");
  const body = rows
    .map((item) => {
      const cols = [
        item.id,
        item.title,
        item.username,
        item.avatar,
        item.controllerName,
        item.methodName,
        item.business,
        item.oper,
        item.params,
        item.status,
        item.timeLong,
        item.response,
        formatTime(item.createTime),
        item.address,
        item.ip,
        item.userAgent,
        item.url,
        item.errorMessage,
      ];
      return `<tr>${cols.map((c) => `<td>${escapeHtml(c)}</td>`).join("")}</tr>`;
    })
    .join("");

  return `\uFEFF<html><head><meta charset="UTF-8" /></head><body><table border="1"><thead><tr>${head}</tr></thead><tbody>${body}</tbody></table></body></html>`;
}

function pickExportForm(query: Record<string, unknown>): SysLogPageForm {
  return {
    username: query.username as string | undefined,
    title: query.title as string | undefined,
    methodName: (query.methodName ?? query.method_name) as string | undefined,
    business: query.business as string | number | undefined,
    oper: query.oper as string | number | undefined,
    status: query.status as string | number | undefined,
    beginDate: query.beginDate as string | undefined,
    endDate: query.endDate as string | undefined,
  };
}

Application.POST(
  "/api/log/page",
  async (body: PageRequest<SysLogPageForm>) => {
    return getSysLogService().getPageResult(body ?? { pageNum: 1, pageSize: 10 });
  },
  {
    auth: { roles: ["ROLE_admin"] },
    paramType: ParamType.BODY,
    log: { title: "操作日志分页", business: BusinessType.LIST },
  }
);

Application.GET(
  "/api/log/export",
  async (req: Request, res: Response) => {
    const form = pickExportForm((req.query ?? {}) as Record<string, unknown>);
    const rows = await getSysLogService().listForExport(form);
    const html = buildExportHtml(rows);
    const filename = encodeURIComponent("操作日志.xls");
    res.setHeader(
      "Content-Type",
      "application/vnd.ms-excel;charset=utf-8"
    );
    res.setHeader(
      "Content-Disposition",
      `attachment; filename*=UTF-8''${filename}`
    );
    res.send(html);
  },
  {
    auth: { roles: ["ROLE_admin"] },
    raw: true,
    log: { title: "导出操作日志", business: BusinessType.EXPORT },
  }
);
