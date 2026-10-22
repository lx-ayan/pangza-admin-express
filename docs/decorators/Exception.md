# Exception 装饰器：全局异常如何注册与匹配

源码：`Exception/decorators.ts`、`registry.ts`、`handler.ts`

---

## 一、要对齐的 Spring 模型

| Spring | 本框架 |
|--------|--------|
| `@RestControllerAdvice` | `@ControllerAdvice()` |
| `@ExceptionHandler(XxxException.class)` | `@ExceptionHandler(XxxException)` |
| 抛错后进入 Advice | `mountRoute` 的 `catch` → `handleException` |

---

## 二、为何 Advice 能被「识别」？

### 2.1 扫描加载

`loadControllers` 会加载 `advice/` 目录下的文件。  
文件 `require` 后，类装饰器执行。

### 2.2 `@ExceptionHandler` 只「登记待办」

```ts
export function ExceptionHandler(errorType: Function = Error): MethodDecorator {
  return (target, propertyKey) => {
    const list = Reflect.getOwnMetadata(HANDLERS_KEY, ctor) ?? [];
    list.push({ errorType, handlerName: String(propertyKey) });
    Reflect.defineMetadata(HANDLERS_KEY, list, ctor);
  };
}
```

此时还没注册到全局表，只是记在类上：`[{ errorType: BizException, handlerName: "handleBiz" }, ...]`。

### 2.3 `@ControllerAdvice` 真正注册

```ts
export function ControllerAdvice(): ClassDecorator {
  return (ctor) => {
    const pending = Reflect.getOwnMetadata(HANDLERS_KEY, ctor) ?? [];
    const instance = new Ctor();
    for (const item of pending) {
      const bound = instance[item.handlerName].bind(instance);
      registerExceptionHandler({
        errorType: item.errorType,
        handlerName: `${Ctor.name}.${item.handlerName}`,
        handler: bound,
      });
    }
  };
}
```

**顺序注意：** 方法装饰器先于类装饰器执行（TS 规则），所以当 `@ControllerAdvice` 跑起来时，`HANDLERS_KEY` 里已经有列表。

---

## 三、抛错后如何匹配到处理器？

```ts
// Application.mountRoute
catch (e) {
  await handleException(req, response, e);
}
```

`handleException` / `resolveExceptionHandler` 大致策略：

1. 找 **error 的构造函数精确匹配** 的 handler  
2. 再找 **继承链** 上能对上的  
3. 再找登记为 `Error` 的兜底  
4. 框架还有内置映射：`AuthError` / `OrmError` / `GuardError` / `ValidationError` / `BizException` 等

自定义 Advice 可覆盖或补充这些行为。

---

## 四、注解参数与用法

### `@ControllerAdvice()`

| 项 | 说明 |
|----|------|
| 参数 | 无 |
| 作用 | new 实例 + 注册所有 `@ExceptionHandler` |

### `@ExceptionHandler(errorType?)`

| 项 | 说明 |
|----|------|
| 参数 | 错误类，默认 `Error` |
| 方法返回 | 可序列化对象；由 handler 层写成 HTTP 响应 |

```ts
@ControllerAdvice()
class GlobalExceptionHandler {
  @ExceptionHandler(BizException)
  handleBiz(e: BizException) {
    return { code: e.code, message: e.message };
  }

  @ExceptionHandler(ValidationError)
  handleValid(e: ValidationError) {
    return { code: e.code, message: e.message, errors: e.errors };
  }

  @ExceptionHandler() // 兜底 Error
  handleOther(e: Error) {
    return { code: 500, message: e.message || "服务器错误" };
  }
}
```

---

## 五、函数式注册（不用装饰器）

```ts
registerHandler(BizException, (e) => ({ code: e.code, message: e.message }));
```

与装饰器殊途同归，都进同一个 registry。

---

## 六、和业务抛错的配合

```ts
throw new BizException("用户不存在", 404);
// 或 ValidationError / AuthError / OrmError / GuardError
```

只要错误类型在 Advice 或内置映射里有对应 handler，响应格式就统一，无需每个 Controller try/catch。
