import { Context, Next, Session } from "koishi";
import { RuleTable } from "../core";
import { Config, Type } from "../type";

export namespace Middleware {
  export function isPrivate(session: Session) {
    return session.event.channel?.type === 1;
  }

  export function isAdmin(session: Session, config: Config) {
    return config.admins.some(
      (admin) =>
        session.platform === admin.platform && session.userId === admin.id
    );
  }

  async function isRuleMatched(ctx: Context, session: Session) {
    for (const rule of await ctx.database.get(RuleTable.Table, {})) {
      if (!rule.enabled) {
        continue;
      }
      const matched = Type.ComputeRule(rule.rule, session);
      if (rule.mode === "blacklist" && matched) {
        return false;
      }
      if (rule.mode === "whitelist" && matched) {
        return true;
      }
    }
    return false;
  }

  export function BeforeExecute(
    ctx: Context,
    config: Config
  ): (argv: any) => Promise<string> {
    return async ({ session }) => {
      if (isPrivate(session) && isAdmin(session, config)) {
        return;
      }
      if (await isRuleMatched(ctx, session)) {
        return;
      }
      return "";
    };
  }

  export function Interceptor(ctx: Context, config: Config) {
    return async (session: Session, next: Next) => {
      if (isPrivate(session) && isAdmin(session, config)) {
        return next();
      }
      if (await isRuleMatched(ctx, session)) {
        return next();
      }
      return;
    };
  }
}
