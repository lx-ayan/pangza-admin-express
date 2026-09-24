import "@/config";
import { getOrmConfig, table } from "@/framework/ORM";
import TestMapper from "@/business/mapper/test";
import UserMapper from "@/business/mapper/user";

async function main() {
  console.log("global", getOrmConfig().logicDelete, getOrmConfig().logicDeleteField);

  const user = table("user", { logicDelete: true, fill: true });
  const test = table("test", { fill: false });
  console.log("user mapper opts", (user as any).opts);
  console.log("test mapper opts", (test as any).opts);

  const um = new UserMapper();
  const tm = new TestMapper();
  try {
    const list = await (tm as any).selectList();
    console.log("test selectList ok", Array.isArray(list), list?.length);
  } catch (e: any) {
    console.log("test selectList ERR", e.sqlMessage || e.message);
  }

  try {
    const n = await (tm as any).deleteById(999999);
    console.log("test deleteById ok", n);
  } catch (e: any) {
    console.log("test deleteById ERR", e.sqlMessage || e.message);
  }

  process.exit(0);
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
