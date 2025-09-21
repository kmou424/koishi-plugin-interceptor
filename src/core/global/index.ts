import { Session } from "koishi";
import { Type } from "../../type";
import { RuleTable } from "../orm";
import TTLCache from "../ttl_cache";

export const EditModeTTL = 600;

export const EditModeMap: Record<string, TTLCache<RuleTable.Schema>> = {};

export function IsEditMode(session: Session): boolean {
  const user = new Type.User(session);
  if (!user.Valid) {
    return false;
  }
  const cache = EditModeMap[user.toString()];
  if (!cache || cache.expired) {
    return false;
  }
  return true;
}
