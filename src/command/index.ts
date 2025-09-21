import { Context, Command as KoishiCommand } from "koishi";
import { AppName } from "../type";

export * from "./edit";
export * from "./normal";

export namespace CommonCommand {
  export function Root(ctx: Context): KoishiCommand.Action {
    return async ({ session }) => {
      await session.execute(`help ${AppName}`);
    };
  }
}
