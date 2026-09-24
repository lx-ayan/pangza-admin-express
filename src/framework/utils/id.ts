/** 简易雪花风格 ID（字符串），对齐 Java ASSIGN_ID 用法 */
let seq = 0;

export function nextId(): string {
  const now = BigInt(Date.now());
  seq = (seq + 1) % 4096;
  const id = (now << 12n) | BigInt(seq);
  return id.toString();
}
