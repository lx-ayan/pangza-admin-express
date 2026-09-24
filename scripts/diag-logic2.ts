import "@/config";
import Db from "@/framework/ORM/Db";
import { table } from "@/framework/ORM";

async function main() {
  await Db.connect();
  const cols = await Db.query<any[]>("SHOW COLUMNS FROM test");
  console.log(
    "test cols",
    cols.map((c) => c.Field).join(",")
  );
  const rows = await Db.query<any[]>("SELECT * FROM test");
  console.log("test raw rows", rows);

  const mapper = table("test", { fill: false });
  console.log("logicDelete", (mapper as any).opts.logicDelete);

  const before = await mapper.selectList();
  console.log("selectList", before);

  if (rows[0]) {
    const id = rows[0].id;
    const n = await mapper.deleteById(id);
    console.log("deleteById", id, "affected", n);
    const afterLogic = await mapper.selectList();
    console.log("selectList after delete", afterLogic);
    const rawAfter = await Db.query<any[]>("SELECT * FROM test WHERE id = ?", [
      id,
    ]);
    console.log("raw after delete", rawAfter);
  }

  process.exit(0);
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
