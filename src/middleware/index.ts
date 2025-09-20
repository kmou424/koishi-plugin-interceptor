import { Context, Next, Session } from "koishi";
import { EditModeMap, RuleTable } from "../core";
import { Config, Type } from "../type";

export namespace Middleware {
  const commands: Record<string, string> = {
    exit: "退出编辑模式",
    "drop {index}": "删除条件",
    "add {type} {compare} {target}": "添加条件",
    "rename {name}": "重命名拦截器",
    mode: "切换拦截模式",
    switch: "切换开启状态",
    show: "显示拦截器详情",
    help: "显示帮助",
  };
  const help = Object.entries(commands).map(
    ([key, value]) => `${value}: ${key}`
  );
  const argvSizeMap = {
    exit: 0,
    drop: 1,
    add: 3,
    rename: 1,
    mode: 0,
    switch: 0,
    show: 0,
    help: 0,
  };
  export function Message(ctx: Context) {
    return async (session: Session, next: Next) => {
      const user = new Type.User(session);
      if (!user.Valid) {
        return next();
      }
      const cache = EditModeMap[user.toString()];
      if (!cache || cache.expired) {
        return next();
      }

      const schema = await cache.get();
      let messages = [
        `正在编辑拦截器 ${RuleTable.FormatSchema(schema, false)}`,
      ];

      let command = "help";
      let args = [];
      for (const key of Object.keys(argvSizeMap)) {
        if (session.content.startsWith(key)) {
          command = key;
          args = session.content.split(" ", argvSizeMap[key] + 1);
          break;
        }
      }
      if (args.length - 1 !== argvSizeMap[command]) {
        session.send("参数数量不正确");
        return;
      }

      let markUpdate: Record<string, any> | null = null;

      switch (command) {
        case "exit":
          cache.markExpired();
          messages.push("已退出编辑模式");
          break;
        case "drop":
          const index = args[1];
          if (index < 0 || index >= schema.rule.length) {
            session.send("索引超出范围");
            return;
          }
          schema.rule.splice(index, 1);
          messages.push(`已删除条件 ${index}`);
          markUpdate = {
            rule: schema.rule,
          };
          break;
        case "add":
          const type = Type.ConditionTypeReverseMap[args[1]];
          if (!type) {
            session.send(
              `类型不正确, 可选: ${Object.keys(
                Type.ConditionTypeReverseMap
              ).join(", ")}`
            );
            return;
          }
          const compare = Type.ConditionCompareReverseMap[args[2]];
          if (!compare) {
            session.send(
              `比较方式不正确, 可选: ${Object.keys(
                Type.ConditionCompareReverseMap
              ).join(", ")}`
            );
            return;
          }
          const target = args[3];
          if (!schema.rule) {
            schema.rule = [];
          }
          schema.rule.push({ type, compare, target });
          markUpdate = {
            rule: schema.rule,
          };
          messages.push(`已添加条件 ${type} ${compare} ${target}`);
          break;
        case "rename":
          schema.name = args[1];
          markUpdate = {
            name: schema.name,
          };
          messages.push(`已重命名拦截器 ${args[1]}`);
          break;
        case "mode":
          if (schema.mode === "whitelist") {
            schema.mode = "blacklist";
          } else {
            schema.mode = "whitelist";
          }
          markUpdate = {
            mode: schema.mode,
          };
          messages.push(`已切换拦截模式 ${schema.mode}`);
          break;
        case "switch":
          schema.enabled = !schema.enabled;
          markUpdate = {
            enabled: schema.enabled,
          };
          messages.push(`已切换开启状态 ${schema.enabled}`);
          break;
        case "show":
          messages.push(`拦截器详情:`);
          messages.push(RuleTable.FormatSchema(schema, true));
          break;
        case "help":
          messages.push(...help);
          break;
        default:
          messages.push(...help);
          break;
      }

      if (markUpdate) {
        await ctx.database.set(
          RuleTable.Table,
          { id: schema.id },
          {
            ...markUpdate,
            updatedAt: new Date(),
          }
        );
        cache.update();
      }

      session.send(messages.join("\n"));
    };
  }

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
