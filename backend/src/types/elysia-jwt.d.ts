import "@elysiajs/jwt";

declare module "elysia" {
  interface ElysiaContext {
    jwt: ReturnType<typeof import("@elysiajs/jwt")>["jwt"];
  }
}
