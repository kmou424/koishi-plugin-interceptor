import { Context, Command as KoishiCommand } from "koishi";
import { EditModeMap, EditModeTTL, RuleTable } from "../core";
import TTLCache from "../core/ttl_cache";
import { AppName, Type } from "../type";

export namespace NormalModeCommand {
  export function Register(ctx: Context): void {
    ctx.command(`${AppName}.list`, "列出拦截器").action(List(ctx));
    ctx.command(`${AppName}.new <name:string>`, "添加拦截器").action(New(ctx));
    ctx
      .command(`${AppName}.delete <id:number>`, "删除拦截器")
      .action(Delete(ctx));
    ctx
      .command(`${AppName}.edit <id:number>`, "选中拦截器进入编辑模式")
      .action(Edit(ctx));
  }

  function List(ctx: Context): KoishiCommand.Action {
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

  function New(ctx: Context): KoishiCommand.Action {
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

  function Delete(ctx: Context): KoishiCommand.Action {
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

  function Edit(ctx: Context): KoishiCommand.Action {
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
