type Nullable<T = any> = T | null;

interface OtherParam {
  [args: string]: any
}

type Optional<T, K extends keyof T> = Omit<T, K> & Partial<Pick<T, K>>;

type ExcludeAndPartial<T, K extends keyof T> = Partial<Omit<T, K>>;

type UndefinedAble<T = any> = T | undefined;

interface ResponseData<T = any> {
  code: number;
  data: Nullable<T>;
  message?: string;
}

interface LabelOption extends OtherParam {
  value: any;
  label: string;
  disabled?: boolean;
  children?: LabelOptionList;
}

type LabelOptionList = LabelOption[]

type FunctionArgs<Args = any[], Return = void> = (...args: Args) => Return;

type ParamType<T> = T extends (param: infer P) => any ? P : never;