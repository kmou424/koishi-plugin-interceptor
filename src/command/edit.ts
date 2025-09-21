import { Context, Command as KoishiCommand, Session } from "koishi";
import { EditModeMap, RuleTable } from "../core";
import TTLCache from "../core/ttl_cache";
import { AppName, Type } from "../type";

export namespace EditModeCommand {
  export function Register(ctx: Context): void {
    ctx.command(`${AppName}.exit`, "退出编辑模式").action(Exit(ctx));
    ctx.command(`${AppName}.drop <index:number>`, "删除条件").action(Drop(ctx));
    ctx
      .command(
        `${AppName}.add <type:string> <compare:string> <target:string>`,
        "添加条件"
      )
      .action(Add(ctx));
    ctx
      .command(`${AppName}.rename <name:string>`, "重命名拦截器")
      .action(Rename(ctx));
    ctx.command(`${AppName}.mode`, "切换拦截模式").action(Mode(ctx));
    ctx.command(`${AppName}.switch`, "切换开启状态").action(Switch(ctx));
    ctx.command(`${AppName}.show`, "显示拦截器详情").action(Show(ctx));
  }

  interface EditModeInput {
    session: Session;
    messages: string[];
    cache: TTLCache<RuleTable.Schema>;
    schema: RuleTable.Schema;
    args: any[];
  }

  interface EditModeOutput {
    messages: string[];
    markUpdate: Record<string, any> | null;
  }

  function CommandWrapper(
    ctx: Context,
    callback: (input: EditModeInput) => Promise<EditModeOutput>
  ): KoishiCommand.Action {
    return async ({ session }, ...args: any[]) => {
      const user = new Type.User(session);
      if (!user.Valid) {
        session.send("无法验证用户");
        return;
      }
      const cache = EditModeMap[user.toString()];
      if (!cache || cache.expired) {
        session.send("不在编辑模式中");
        return;
      }
      const schema = await cache.get();
      if (!schema) {
        session.send("获取拦截器失败");
        return;
      }
      const output = await callback({
        session,
        messages: [`正在编辑拦截器 ${RuleTable.FormatSchema(schema, false)}`],
        cache,
        schema,
        args,
      });
      if (output.markUpdate) {
        await ctx.database.set(
          RuleTable.Table,
          { id: schema.id },
          {
            ...output.markUpdate,
            updatedAt: new Date(),
          }
        );
        cache.update();
      }
      if (output.messages) {
        session.send(output.messages.join("\n"));
      }
    };
  }

  const Exit = (ctx: Context): KoishiCommand.Action =>
    CommandWrapper(ctx, async ({ session, messages, cache }) => {
      messages.push("已退出编辑模式");
      cache.markExpired();
      return {
        messages,
        markUpdate: null,
      };
    });

  const Drop = (ctx: Context): KoishiCommand.Action =>
    CommandWrapper(ctx, async ({ session, messages, cache, schema, args }) => {
      const out = {
        messages: null,
        markUpdate: null,
      } as EditModeOutput;
      if (args.length !== 1) {
        await session.execute(`help ${AppName}.drop`);
        return out;
      }
      out.messages = messages;

      const index = args[0] as number;
      if (index < 0 || index >= schema.rule.length) {
        out.messages.push("索引超出范围");
        return out;
      }
      schema.rule.splice(index, 1);
      out.messages.push(`已删除条件 ${index}`);
      out.markUpdate = {
        rule: schema.rule,
      };
      return out;
    });

  const Add = (ctx: Context): KoishiCommand.Action =>
    CommandWrapper(ctx, async ({ session, messages, cache, schema, args }) => {
      const out = {
        messages: null,
        markUpdate: null,
      } as EditModeOutput;
      if (args.length !== 3) {
        out.messages = [];
        out.messages.push(
          `参数 type 可选: ${Object.keys(Type.ConditionTypeReverseMap).join(
            ", "
          )}`
        );
        out.messages.push(
          `参数 compare 可选: ${Object.keys(
            Type.ConditionCompareReverseMap
          ).join(", ")}`
        );
        await session.execute(`help ${AppName}.add`);
        return out;
      }
      out.messages = messages;

      const type = Type.ConditionTypeReverseMap[args[0]];
      if (!type) {
        out.messages.push("类型不正确, 查看帮助以获取更多信息");
        return out;
      }
      const compare = Type.ConditionCompareReverseMap[args[1]];
      if (!compare) {
        out.messages.push("比较方式不正确, 查看帮助以获取更多信息");
        return out;
      }
      const target = args[2] as string;
      schema.rule.push({
        type,
        compare,
        target,
      });
      out.messages.push(`已添加条件: ${args[0]} ${args[1]} ${args[2]}`);
      out.markUpdate = {
        rule: schema.rule,
      };
      return out;
    });

  const Rename = (ctx: Context): KoishiCommand.Action =>
    CommandWrapper(ctx, async ({ session, messages, cache, schema, args }) => {
      const out = {
        messages: null,
        markUpdate: null,
      } as EditModeOutput;
      if (args.length !== 1) {
        await session.execute(`help ${AppName}.rename`);
        return out;
      }
      out.messages = messages;

      schema.name = args[0] as string;
      out.messages.push(`已重命名拦截器为 ${args[0]}`);
      out.markUpdate = {
        name: schema.name,
      };
      return out;
    });

  const Mode = (ctx: Context): KoishiCommand.Action =>
    CommandWrapper(ctx, async ({ session, messages, cache, schema, args }) => {
      const out = {
        messages: messages,
        markUpdate: null,
      } as EditModeOutput;
      if (schema.mode === "whitelist") {
        schema.mode = "blacklist";
      } else {
        schema.mode = "whitelist";
      }
      out.messages.push(`已切换拦截模式为 ${schema.mode}`);
      out.markUpdate = {
        mode: schema.mode,
      };
      return out;
    });

  const Switch = (ctx: Context): KoishiCommand.Action =>
    CommandWrapper(ctx, async ({ session, messages, cache, schema, args }) => {
      const out = {
        messages: messages,
        markUpdate: null,
      } as EditModeOutput;
      schema.enabled = !schema.enabled;
      out.messages.push(`已切换开启状态为 ${schema.enabled}`);
      out.markUpdate = {
        enabled: schema.enabled,
      };
      return out;
    });

  const Show = (ctx: Context): KoishiCommand.Action =>
    CommandWrapper(ctx, async ({ session, messages, cache, schema, args }) => {
      const out = {
        messages: messages,
        markUpdate: null,
      } as EditModeOutput;
      out.messages.push(`拦截器详情:`);
      out.messages.push(RuleTable.FormatSchema(schema, true));
      return out;
    });
}
