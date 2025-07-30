import { Elysia } from "elysia";
import { cors } from "@elysiajs/cors";
import { villageRoutes } from "./routes/village";
import { houseRoutes } from "./routes/house";

const app = new Elysia()
  .use(cors())
  .use(villageRoutes)
  .use(houseRoutes)
  .get("/", () => "Hello Village Security API!");

app.listen(3001, () => {
  console.log("🦊 Village Security API is running at http://localhost:3001");
});

