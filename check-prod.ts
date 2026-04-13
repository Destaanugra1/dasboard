import { db } from "./src/db/index.ts";
import { products } from "./src/db/schema.ts";

async function run() {
  const allProducts = await db.select().from(products);
  console.log("Products in DB:", JSON.stringify(allProducts, null, 2));
}

run().catch(console.error);
