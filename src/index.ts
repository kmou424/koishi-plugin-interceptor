import { Context, Events } from "koishi";
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

  const events: (keyof Events<Context>)[] = [
    "message",
    "message-deleted",
    "message-updated",
    "reaction-added",
    "reaction-removed",

    "command/before-execute",
  ];
  for (const event of events) {
    ctx.on(event, Middleware.BeforeExecute(ctx, config));
  }
  ctx.middleware(Middleware.Interceptor(ctx, config), true);

  ctx = ctx.intersect(
    (session) =>
      Middleware.isPrivate(session) && Middleware.isAdmin(session, config)
  );

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
