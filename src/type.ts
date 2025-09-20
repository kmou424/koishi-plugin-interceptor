import { Schema, Session } from "koishi";

export const AppName = "interceptor";

export interface Admin {
  platform: string;
  id: string;
}

export const Admin: Schema<Admin> = Schema.object({
  platform: Schema.string().description("平台"),
  id: Schema.string().description("ID"),
});

export interface Config {
  admins: Admin[];
}

export const Config: Schema<Config> = Schema.object({
  admins: Schema.array(Admin).default([]).description("管理员"),
});

export namespace Type {
  export type Condition = {
    type: "platform" | "guild" | "user" | "message";
    compare: "eq" | "neq" | "in" | "nin";
    target: string;
  };

  export const ConditionTypeMap = {
    platform: "平台",
    guild: "群组",
    user: "用户",
    message: "消息",
  };

  export const ConditionTypeReverseMap = {
    平台: "platform",
    群组: "guild",
    用户: "user",
    消息: "message",
  };

  export const ConditionCompareMap = {
    eq: "等于",
    neq: "不等于",
    in: "包含",
    nin: "不包含",
  };

  export const ConditionCompareReverseMap = {
    等于: "eq",
    不等于: "neq",
    包含: "in",
    不包含: "nin",
  };

  export function ComputeCondition(
    condition: Condition,
    session: Session
  ): boolean {
    const { platform, guild, user, message } = {
      platform: session.event.platform,
      guild: session.event.guild?.id ?? "",
      user: session.event.user?.id ?? "",
      message: session.event.message?.content ?? "",
    };
    switch (condition.type) {
      case "platform":
        return CompareString(platform, condition.compare, condition.target);
      case "guild":
        return CompareString(guild, condition.compare, condition.target);
      case "user":
        return CompareString(user, condition.compare, condition.target);
      case "message":
        return CompareString(message, condition.compare, condition.target);
    }
  }

  export function FormatCondition(condition: Condition): string {
    return `${ConditionTypeMap[condition.type]} ${
      ConditionCompareMap[condition.compare]
    } "${condition.target}"`;
  }

  function CompareString(
    source: string,
    compare: string,
    target: string
  ): boolean {
    switch (compare) {
      case "eq":
        return source === target;
      case "neq":
        return source !== target;
      case "in":
        return source.includes(target);
      case "nin":
        return !source.includes(target);
    }
  }

  export type Rule = Condition[];

  export function ComputeRule(rule: Rule, session: Session): boolean {
    return rule.every((condition) => ComputeCondition(condition, session));
  }

  export class User {
    private platform: string;
    private id: string;

    constructor(session: Session) {
      this.platform = session.event.platform;
      this.id = session.event.user?.id ?? "";
    }

    public get Valid(): boolean {
      return this.platform !== "" && this.id !== "";
    }

    public get Platform(): string {
      return this.platform;
    }

    public get Id(): string {
      return this.id;
    }

    public toString(): string {
      return `${this.platform}:${this.id}`;
    }
  }
}
