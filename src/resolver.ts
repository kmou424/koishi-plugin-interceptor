import type { Session } from "koishi";
import type { Condition } from "./type";

export interface Resolver {
  resolve: (session: Session, condition: Condition) => boolean;
}

export const WhiteList: Resolver = {
  resolve: (session: Session, condition: Condition): boolean => {
    switch (condition.type) {
      case "platform":
        return compare_string(
          session.platform,
          condition.compare,
          condition.target
        );
      case "guild":
        return compare_string(
          session.event.guild?.id ?? "",
          condition.compare,
          condition.target
        );
      case "user":
        return compare_string(
          session.event.user?.id ?? "",
          condition.compare,
          condition.target
        );
      case "message":
        return compare_string(
          session.event.message?.content ?? "",
          condition.compare,
          condition.target
        );
    }
  },
};

export const BlackList: Resolver = {
  resolve: (session: Session, condition: Condition): boolean => {
    switch (condition.type) {
      case "platform":
        return !compare_string(
          session.platform,
          condition.compare,
          condition.target
        );
      case "guild":
        return !compare_string(
          session.event.guild?.id ?? "",
          condition.compare,
          condition.target
        );
      case "user":
        return !compare_string(
          session.event.user?.id ?? "",
          condition.compare,
          condition.target
        );
      case "message":
        return !compare_string(
          session.event.message?.content ?? "",
          condition.compare,
          condition.target
        );
    }
  },
};

const compare_string = (
  source: string,
  compare: string,
  target: string
): boolean => {
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
};
