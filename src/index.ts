import { Context, Next, Session } from "koishi";
import type { Resolver } from "./resolver";
import { BlackList, WhiteList } from "./resolver";
import type { Config } from "./type";

export * from "./type";

export const name = "interceptor";

export function apply(ctx: Context, config: Config) {
  ctx.middleware(interceptor(ctx, config));
}

const interceptor =
  (ctx: Context, config: Config) => (session: Session, next: Next) => {
    const resolver = ((): Resolver | null => {
      switch (config.mode) {
        case "whitelist":
          return WhiteList;
        case "blacklist":
          return BlackList;
        default:
          return null;
      }
    })();
    if (!resolver) {
      throw new Error("Invalid mode");
    }

    if (
      config.conditions.some((condition) =>
        resolver.resolve(session, condition)
      )
    ) {
      return next();
    }
  };
