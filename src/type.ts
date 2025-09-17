import { Schema } from "koishi";

export interface Condition {
  type: "platform" | "guild" | "user" | "message";
  compare: "eq" | "neq" | "in" | "nin";
  target: string;
}

export const Condition: Schema<Condition> = Schema.object({
  type: Schema.union([
    Schema.const("platform").description("平台"),
    Schema.const("guild").description("频道"),
    Schema.const("user").description("用户"),
    Schema.const("message").description("内容"),
  ]).description("类型"),
  compare: Schema.union([
    Schema.const("eq").description("等于"),
    Schema.const("neq").description("不等于"),
    Schema.const("in").description("包含"),
    Schema.const("nin").description("不包含"),
  ]).description("对比方式"),
  target: Schema.string().description("目标值"),
});

export interface Config {
  mode: "whitelist" | "blacklist";
  conditions: Condition[];
}

export const Config: Schema<Config> = Schema.object({
  mode: Schema.union([
    Schema.const("whitelist").description("白名单模式"),
    Schema.const("blacklist").description("黑名单模式"),
  ]).description("拦截模式"),
  conditions: Schema.array(Condition).description("条件"),
});
