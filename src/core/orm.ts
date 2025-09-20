import { Context, Field, FlatKeys, Model, Types } from "koishi";
import { AppName, Type } from "../type";

declare module "koishi" {
  interface Tables {
    [RuleTable.Table]: RuleTable.Schema;
  }
}

export function migrate(ctx: Context) {
  ctx.model.extend(RuleTable.Table, RuleTable.Schema, RuleTable.SchemaConfig);
}

export namespace Base {
  export interface Schema {
    id: number;
    createdAt: Date;
    updatedAt: Date;
  }

  export const Schema: Field.Extension<Schema, Types> = {
    id: {
      type: "integer",
      nullable: false,
    },
    createdAt: {
      type: "date",
      nullable: false,
    },
    updatedAt: {
      type: "date",
      nullable: false,
    },
  };

  export const SchemaConfig: Model.Config<FlatKeys<Schema, any>> = {
    primary: "id",
    unique: ["id"],
    indexes: ["id"],
    foreign: {},
    autoInc: true,
  };
}

export namespace RuleTable {
  export const Table = `${AppName}.rules`;

  export type Schema = {
    name: string;
    mode: "whitelist" | "blacklist";
    rule: Type.Rule;
    enabled: boolean;
  } & Base.Schema;

  export const Schema: Field.Extension<Schema, Types> = {
    name: {
      type: "string",
      nullable: false,
    },
    mode: {
      type: "string",
      nullable: false,
    },
    rule: {
      type: "json",
      nullable: false,
    },
    enabled: {
      type: "boolean",
      nullable: false,
    },
    ...(Base.Schema as Field.Extension<Schema, Types>),
  };

  export const SchemaConfig: Model.Config<FlatKeys<Schema, any>> = {
    ...(Base.SchemaConfig as Model.Config<FlatKeys<Schema, any>>),
  };

  export function FormatSchema(schema: Schema, full?: boolean): string {
    const messages = [
      `[${schema.id}] [${schema.name} - ${
        schema.mode === "whitelist" ? "白名单" : "黑名单"
      } - ${schema.enabled ? "开启" : "关闭"}]`,
    ];
    if (full) {
      messages.push(
        `规则: [${
          schema.rule.length > 0
            ? schema.rule.map((rule) => Type.FormatCondition(rule)).join(",")
            : "无"
        }]`
      );
    }
    return messages.join(" ");
  }
}
