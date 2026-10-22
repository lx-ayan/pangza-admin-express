# Validate 装饰器：规则如何挂上、为何能校验到 Body？

源码：`Validate/decorators.ts`、`engine.ts`、`rules.ts`  
依赖：`emitDecoratorMetadata: true` + 入口 `reflect-metadata`

---

## 一、两层分工

| 层 | 注解 | 作用 |
|----|------|------|
| DTO 属性 | `@NotNull` `@Min` `@Max` `@Email` `@Phone` `@Custom` | 把规则写到**类**的 `pangza.validate.rules` |
| Controller 方法 | `@Validate()` | 告诉路由：「执行前校验入参」；并保存 `design:paramtypes` |

只有属性规则、没有 `@Validate()` → 路由不会自动校验（仍可用 `validateHandler` 手动调）。  
只有 `@Validate()`、DTO 上没规则 → 通过（无规则可跑）。

---

## 二、属性规则如何写入？

```ts
function addRule(ctor, property, rule) {
  const map = { ...ruleMap(ctor) };
  map[property] = [...(map[property] ?? []), rule];
  Reflect.defineMetadata(RULES_KEY, map, ctor);
  addBeanKey(ctor, property);
}

export function NotNull(options?: RuleOptions | string): PropertyDecorator {
  return createPropDecorator(() => notNull(options));
}
```

```ts
class CreateUserDto {
  @NotNull("用户名不能为空")
  @Min(3)
  username!: string;
}
// CreateUserDto 元数据：
// { username: [ NotNullRule, MinRule ] }
```

多个装饰器在同一属性上 → 规则数组累加，全部要过。

---

## 三、各规则注解详解

| 装饰器 | 参数 | 校验逻辑（摘要） |
|--------|------|------------------|
| `@NotNull(msg?)` | string 或 `{ message }` | 拒 undefined/null/空白串 |
| `@Min(n, msg?)` | 最小值 | 数字 ≥ n；字符串/数组看 length；空值一般跳过 |
| `@Max(n, msg?)` | 最大值 | 数字 ≤ n；同上 |
| `@Email(msg?)` | 可选 message | `validator.isEmail` |
| `@Phone(opts?)` | message 或 `{ message, locale }`，默认 `zh-CN` | `validator.isMobilePhone` |
| `@Custom(fn, msg?)` | `(value, object) => boolean \| Promise` | 自定义，可异步 |

```ts
@Phone({ locale: "zh-CN", message: "手机号不正确" })
mobile!: string;

@Custom((v, obj) => v === (obj as any).confirmPassword, "两次密码不一致")
password!: string;
```

函数式等价物：`notNull()` / `min()` / `max()` / `email()` / `phone()` / `custom()`，供 `validateHandler(data, rules)` 使用。

---

## 四、`@Validate()`：为何能知道参数是 CreateUserDto？

### 4.1 TypeScript 的 design:paramtypes

开启 `emitDecoratorMetadata` 后，编译器会在方法上写入参数构造函数列表：

```ts
// 伪代码：编译产物
Reflect.defineMetadata("design:paramtypes", [CreateUserDto], UserController.prototype, "create");
```

### 4.2 `@Validate` 把它抄到路由 option

```ts
export function Validate(): MethodDecorator {
  return (target, propertyKey) => {
    const paramTypes =
      Reflect.getMetadata("design:paramtypes", target, propertyKey) ?? [];
    // 写入 Validate 自己的元数据 + mergeMethodValidate → RouteOption.validate=true, paramTypes=[...]
    mergeMethodValidate(ctor, handlerName, true, paramTypes);
  };
}
```

### 4.3 请求时

```ts
const args = resolveCallbackArgs(...); // args[0] = req.body 对象
await validateMethodArgs(args, option.paramTypes);
// 对每个 arg：若 paramTypes[i] 是带规则的类 → validateHandler(arg, CreateUserDto)
```

**整条链：**

```
@RequestBody() 决定「把 body 塞进第 0 参」
design:paramtypes 决定「第 0 参类型是 CreateUserDto」
CreateUserDto 上的 @NotNull 决定「校验哪些字段」
@Validate() 决定「这个接口要跑校验」
```

缺一环就不完整（例如没 `emitDecoratorMetadata`，paramTypes 为空，校验不会按类执行）。

---

## 五、用法示例

```ts
class CreateUserDto {
  @NotNull()
  @Min(3, "至少 3 位")
  username!: string;

  @Email()
  email!: string;
}

@Controller("/api/user")
class UserController {
  @PostMapping("/create")
  @Validate()
  create(@RequestBody() body: CreateUserDto) {
    return this.userService.insert(body);
  }
}
```

失败 → `ValidationError` → 全局异常处理。

### 手动校验

```ts
await validateHandler(body, CreateUserDto);
await validateHandler(body, {
  username: [notNull(), min(3)],
});
```

---

## 六、为何「能识别」？

1. DTO 文件被加载 → 属性装饰器写 `validate.rules`  
2. Controller 方法加 `@Validate` → 打开开关并保存参数类型  
3. `mountRoute` 读 `option.validate` / `paramTypes` → 调引擎  
4. 引擎用 `getClassRules(CreateUserDto)` 取规则逐字段执行
