import { BaseService, Service } from "@/framework/Service";
import { OrmError, QueryWrapper } from "@/framework/ORM";
import MockDataPoolMapper from "@/business/mapper/mockDataPool";
import { rowsToCamel, rowToCamel } from "@/framework/utils/case";
import { nextId } from "@/framework/utils/id";
import {
  toPageResult,
  type PageRequest,
  type PageResult,
} from "@/framework/utils/entity/PageResult";

export interface MockDataPoolPageForm {
  keyword?: string;
}

export interface MockDataPoolListForm {
  keyword?: string;
}

export interface CreateMockDataPoolDTO {
  name: string;
  description?: string;
  dataContent: string;
  sortNum?: number;
}

export interface GenerateMockDataVO {
  name: string;
  value: string;
}

@Service(MockDataPoolMapper)
export default class MockDataPoolService extends BaseService {
  async createMockDataPool(dto: CreateMockDataPoolDTO): Promise<void> {
    if (!dto?.name?.trim() || !dto?.dataContent?.trim()) {
      throw new OrmError("参数错误");
    }
    if (await this.hasName(dto.name.trim(), null)) {
      throw new OrmError("当前数据名称已存在，请勿重复创建");
    }
    await this.insert({
      id: nextId(),
      name: dto.name.trim(),
      description: dto.description,
      dataContent: this.normalizeDataContent(dto.dataContent),
      sortNum: dto.sortNum ?? 0,
    });
  }

  async updateMockDataPool(row: Record<string, unknown>): Promise<void> {
    const id = String(row.id ?? "");
    const name = String(row.name ?? "").trim();
    const dataContent = String(row.dataContent ?? "").trim();
    if (!id || !name || !dataContent) {
      throw new OrmError("参数错误");
    }
    if (await this.hasName(name, id)) {
      throw new OrmError("当前数据名称已存在，请勿重复创建");
    }
    await this.updateById({
      ...row,
      id,
      name,
      dataContent: this.normalizeDataContent(dataContent),
    });
  }

  async deleteMockDataPool(id: string): Promise<void> {
    await this.deleteById(id);
  }

  async getMockDataPool(id: string): Promise<Record<string, unknown> | null> {
    return rowToCamel((await this.selectById(id)) as any);
  }

  async getMockDataPoolPage(
    pageRequest: PageRequest<MockDataPoolPageForm>
  ): Promise<PageResult<Record<string, unknown>>> {
    const pageNum = pageRequest?.pageNum ?? 1;
    const pageSize = pageRequest?.pageSize ?? 10;
    const form = pageRequest?.form ?? {};
    const wrapper = new QueryWrapper();
    if (form.keyword) {
      wrapper.nested((w) => {
        w.like("name", form.keyword!).or().like("description", form.keyword!);
      });
    }
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

  async getMockDataPoolList(
    form?: MockDataPoolListForm
  ): Promise<Record<string, unknown>[]> {
    const wrapper = new QueryWrapper();
    if (form?.keyword) {
      wrapper.nested((w) => {
        w.like("name", form.keyword!).or().like("description", form.keyword!);
      });
    }
    wrapper.orderByAsc("sort_num").orderByDesc("create_time");
    const list = await this.selectList(wrapper);
    return rowsToCamel(list as any);
  }

  async generateMockData(name: string): Promise<GenerateMockDataVO> {
    if (!name?.trim()) throw new OrmError("参数错误");
    const list = await this.selectList(
      new QueryWrapper().eq("name", name.trim())
    );
    if (!list.length) throw new OrmError("数据不存在");
    const row = rowToCamel(list[0] as any) as { dataContent?: string };
    const values = this.parseDataContent(String(row.dataContent ?? ""));
    if (!values.length) {
      throw new OrmError("当前数据池为空，无法生成");
    }
    const value = values[Math.floor(Math.random() * values.length)];
    return { name: name.trim(), value };
  }

  private async hasName(name: string, id: string | null): Promise<boolean> {
    if (!name) return false;
    const wrapper = new QueryWrapper().eq("name", name).select("id");
    if (id) wrapper.ne("id", id);
    const list = await this.selectList(wrapper);
    return list.length > 0;
  }

  private normalizeDataContent(dataContent: string): string {
    const values = this.parseDataContent(dataContent);
    if (!values.length) {
      throw new OrmError("请至少输入一条数据");
    }
    try {
      return JSON.stringify(values);
    } catch {
      throw new OrmError("数据格式不正确");
    }
  }

  private parseDataContent(dataContent: string): string[] {
    if (!dataContent?.trim()) return [];
    const content = dataContent.trim();
    if (content.startsWith("[")) {
      try {
        const parsed = JSON.parse(content);
        if (Array.isArray(parsed)) {
          return parsed.map((v) => String(v)).filter((v) => v.trim() !== "");
        }
      } catch {
        // 兼容逗号分隔
      }
    }
    return content
      .split(/[,，]/)
      .map((s) => s.trim())
      .filter((s) => s !== "");
  }
}
