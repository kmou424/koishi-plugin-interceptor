import { Context } from "koishi";
import { CommonCommand, EditModeCommand, NormalModeCommand } from "./command";
import { IsEditMode, migrate } from "./core";
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

  ctx.command(`${AppName}`, "拦截器管理").action(CommonCommand.Root(ctx));

  NormalModeCommand.Register(
    ctx.intersect((session) => {
      return !IsEditMode(session);
    })
  );

  EditModeCommand.Register(
    ctx.intersect((session) => {
      return IsEditMode(session);
    })
  );
}
