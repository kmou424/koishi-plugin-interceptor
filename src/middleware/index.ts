import { Context, Next, Session } from "koishi";
import { RuleTable } from "../core";
import { Config, Type } from "../type";

export namespace Middleware {
  export function Interceptor(ctx: Context, config: Config) {
    return async (session: Session, next: Next) => {
      for (const rule of await ctx.database.get(RuleTable.Table, {})) {
        if (!rule.enabled) {
          continue;
        }
        if (!Type.ComputeRule(rule.rule, session)) {
          return;
        }
      }
      return next();
    };
  }
}
