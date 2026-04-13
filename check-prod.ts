import { db } from "./src/db/index";
import { products } from "./src/db/schema";

async function run() {
  const allProducts = await db.select().from(products);
  console.log("Products in DB:", JSON.stringify(allProducts, null, 2));
}

run().catch(console.error);
