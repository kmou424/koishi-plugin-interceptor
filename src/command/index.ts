import { Context, Command as KoishiCommand } from "koishi";
import { EditModeMap, EditModeTTL } from "../core";
import { RuleTable } from "../core/orm";
import TTLCache from "../core/ttl_cache";
import { AppName, Type } from "../type";

export namespace Command {
  export function Root(ctx: Context): KoishiCommand.Action {
    return async ({ session }) => {
      await session.execute(`help ${AppName}`);
    };
  }

  export function List(ctx: Context): KoishiCommand.Action {
    return async ({ session }) => {
      const rules = await ctx.database.get(RuleTable.Table, {});
      const messages = ["拦截器列表:"];
      if (rules.length === 0) {
        messages.push("无");
      } else {
        messages.push(
          ...rules.map((rule) => RuleTable.FormatSchema(rule, true))
        );
      }
      session.send(messages.join("\n"));
    };
  }

  export function New(ctx: Context): KoishiCommand.Action {
    return async ({ session }, name: string) => {
      if (!name) {
        session.send("请输入拦截器名称");
        return;
      }
      const rule: unknown = {
        name: name,
        mode: "whitelist",
        rule: [],
        enabled: true,
        createdAt: new Date(),
        updatedAt: new Date(),
      };
      await ctx.database.create(RuleTable.Table, rule as RuleTable.Schema);
      session.send(`已添加拦截器 ${name}`);
    };
  }

  export function Delete(ctx: Context): KoishiCommand.Action {
    return async ({ session }, id: number) => {
      const rule = await ctx.database.get(RuleTable.Table, { id });
      if (!rule || rule.length === 0) {
        session.send(`拦截器 ${id} 不存在`);
        return;
      }
      const schema = rule[0];
      await ctx.database.remove(RuleTable.Table, { id });
      session.send(`已删除拦截器 [${schema.id}] [${schema.name}]`);
    };
  }

  export function Select(ctx: Context): KoishiCommand.Action {
    return async ({ session }, id: number) => {
      const rules = await ctx.database.get(RuleTable.Table, { id });
      if (!rules || rules.length === 0) {
        session.send(`拦截器 ${id} 不存在`);
        return;
      }
      const user = new Type.User(session);
      if (!user.Valid) {
        return;
      }
      const key = user.toString();
      const oldCache = EditModeMap[key];
      if (oldCache && !oldCache.expired) {
        session.send(`你已经在编辑模式中`);
        return;
      }
      const cache = new TTLCache(
        rules[0],
        EditModeTTL,
        async (): Promise<RuleTable.Schema | null> => {
          const rules = await ctx.database.get(RuleTable.Table, { id });
          if (!rules || rules.length === 0) {
            return null;
          }
          return rules[0];
        }
      );
      EditModeMap[user.toString()] = cache;
      session.send(
        `已选中拦截器 ${id} 并进入编辑模式, 请使用 exit 退出或等待 ${EditModeTTL} 秒后自动退出`
      );
    };
  }
}
