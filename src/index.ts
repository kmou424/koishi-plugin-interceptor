import { Context } from "koishi";
import { Command } from "./command";
import { migrate } from "./core";
import { Middleware } from "./middleware";
import { AppName, Config } from "./type";

export * from "./type";

export { AppName } from "./type";

export const inject = {
  required: ["database"],
};

export function apply(ctx: Context, config: Config) {
  migrate(ctx);

  ctx.middleware(Middleware.Interceptor(ctx, config), true);

  ctx = ctx.intersect((session) => {
    // 仅私聊
    if (session.event.channel?.type !== 1) {
      return false;
    }
    // 仅管理员
    return config.admins.some(
      (admin) =>
        session.platform === admin.platform && session.userId === admin.id
    );
  });

  ctx.middleware(Middleware.Message(ctx), true);

  ctx.command(`${AppName}`, "拦截器").action(Command.Root(ctx));
  ctx.command(`${AppName}.list`, "列出拦截器").action(Command.List(ctx));
  ctx
    .command(`${AppName}.new <name:string>`, "添加拦截器")
    .action(Command.New(ctx));
  ctx
    .command(`${AppName}.delete <id:number>`, "删除拦截器")
    .action(Command.Delete(ctx));
  ctx
    .command(`${AppName}.select <id:number>`, "选中拦截器进入编辑模式")
    .action(Command.Select(ctx));
}
