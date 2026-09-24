import { BaseService, Service } from "@/framework/Service";
import { OrmError, QueryWrapper } from "@/framework/ORM";
import TableConfigMapper from "@/business/mapper/tableConfig";
import { rowsToCamel, rowToCamel } from "@/framework/utils/case";
import { nextId } from "@/framework/utils/id";
import {
  toPageResult,
  type PageRequest,
  type PageResult,
} from "@/framework/utils/entity/PageResult";

export interface TableConfigPageForm {
  tableName?: string;
  tableComment?: string;
  keyword?: string;
  beginDate?: string;
  endDate?: string;
}

export interface TableConfigListForm {
  tableName?: string;
  tableComment?: string;
  keyword?: string;
}

export interface CreateTableConfigDTO {
  tableName: string;
  tableComment?: string;
  fieldConfig: string;
  sortNum?: number;
}

@Service(TableConfigMapper)
export default class TableConfigService extends BaseService {
  async createTableConfig(dto: CreateTableConfigDTO): Promise<void> {
    if (!dto?.tableName?.trim() || !dto?.fieldConfig?.trim()) {
      throw new OrmError("参数错误");
    }
    if (await this.hasTableName(dto.tableName.trim(), null)) {
      throw new OrmError("当前表名已存在，请勿重复创建");
    }
    await this.insert({
      id: nextId(),
      tableName: dto.tableName.trim(),
      tableComment: dto.tableComment,
      fieldConfig: this.normalizeFieldConfig(dto.fieldConfig, null),
      sortNum: dto.sortNum ?? 0,
    });
  }

  async updateTableConfig(row: Record<string, unknown>): Promise<void> {
    const id = String(row.id ?? "");
    const tableName = String(row.tableName ?? "").trim();
    const fieldConfig = String(row.fieldConfig ?? "").trim();
    if (!id || !tableName || !fieldConfig) {
      throw new OrmError("参数错误");
    }
    if (await this.hasTableName(tableName, id)) {
      throw new OrmError("当前表名已存在，请勿重复创建");
    }
    const existing = rowToCamel((await this.selectById(id)) as any);
    await this.updateById({
      ...row,
      id,
      tableName,
      fieldConfig: this.normalizeFieldConfig(
        fieldConfig,
        existing?.fieldConfig ? String(existing.fieldConfig) : null
      ),
    });
  }

  async deleteTableConfig(id: string): Promise<void> {
    await this.deleteById(id);
  }

  async getTableConfig(id: string): Promise<Record<string, unknown> | null> {
    return rowToCamel((await this.selectById(id)) as any);
  }

  async getTableConfigPage(
    pageRequest: PageRequest<TableConfigPageForm>
  ): Promise<PageResult<Record<string, unknown>>> {
    const pageNum = pageRequest?.pageNum ?? 1;
    const pageSize = pageRequest?.pageSize ?? 10;
    const wrapper = this.buildKeywordWrapper(pageRequest?.form ?? {});
    wrapper.orderByAsc("sort_num").orderByDesc("create_time");

    const page = await this.selectPage(
      { current: pageNum, size: pageSize },
      wrapper
    );
    return toPageResult({
      ...page,
      records: rowsToCamel(page.records as any),
    });
  }

  async getTableConfigList(
    form?: TableConfigListForm
  ): Promise<Record<string, unknown>[]> {
    const wrapper = this.buildKeywordWrapper(form ?? {});
    wrapper.orderByAsc("sort_num").orderByDesc("create_time");
    const list = await this.selectList(wrapper);
    return rowsToCamel(list as any);
  }

  private buildKeywordWrapper(
    form: TableConfigPageForm | TableConfigListForm
  ): QueryWrapper {
    const wrapper = new QueryWrapper();
    if (form.tableName) wrapper.like("table_name", form.tableName);
    if (form.tableComment) wrapper.like("table_comment", form.tableComment);
    if ("beginDate" in form && form.beginDate) {
      wrapper.ge("create_time", form.beginDate);
    }
    if ("endDate" in form && form.endDate) {
      wrapper.le("create_time", `${form.endDate} 23:59:59`);
    }
    if (form.keyword) {
      wrapper.nested((w) => {
        w.like("table_name", form.keyword!).or().like("table_comment", form.keyword!);
      });
    }
    return wrapper;
  }

  private async hasTableName(
    tableName: string,
    id: string | null
  ): Promise<boolean> {
    if (!tableName) return false;
    const wrapper = new QueryWrapper().eq("table_name", tableName).select("id");
    if (id) wrapper.ne("id", id);
    const list = await this.selectList(wrapper);
    return list.length > 0;
  }

  private normalizeFieldConfig(
    fieldConfig: string,
    existingFieldConfig: string | null
  ): string {
    if (!fieldConfig?.trim()) {
      throw new OrmError("请至少配置一个字段");
    }
    try {
      const root = JSON.parse(fieldConfig);
      let fieldsNode: unknown;
      let wrapperNode: Record<string, unknown> | null = null;

      if (Array.isArray(root)) {
        fieldsNode = root;
        if (existingFieldConfig) {
          try {
            const existingRoot = JSON.parse(existingFieldConfig);
            if (
              existingRoot &&
              typeof existingRoot === "object" &&
              !Array.isArray(existingRoot) &&
              "genConfig" in existingRoot
            ) {
              wrapperNode = {
                fields: fieldsNode,
                genConfig: (existingRoot as any).genConfig,
              };
            }
          } catch {
            // ignore existing parse error
          }
        }
      } else if (
        root &&
        typeof root === "object" &&
        Array.isArray((root as any).fields)
      ) {
        fieldsNode = (root as any).fields;
        wrapperNode = root as Record<string, unknown>;
      } else {
        throw new OrmError("字段配置格式不正确");
      }

      const fields = fieldsNode as any[];
      if (!fields.length) {
        throw new OrmError("请至少配置一个字段");
      }
      const hasFieldName = fields.some(
        (node) =>
          node &&
          typeof node === "object" &&
          node.fieldName != null &&
          String(node.fieldName).trim() !== ""
      );
      if (!hasFieldName) {
        throw new OrmError("请至少配置一个有效字段名");
      }

      return JSON.stringify(wrapperNode ?? fieldsNode);
    } catch (e) {
      if (e instanceof OrmError) throw e;
      throw new OrmError("字段配置格式不正确");
    }
  }
}
