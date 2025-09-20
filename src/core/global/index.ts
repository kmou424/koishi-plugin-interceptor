import { RuleTable } from "../orm";
import TTLCache from "../ttl_cache";

export const EditModeTTL = 600;

export const EditModeMap: Record<string, TTLCache<RuleTable.Schema>> = {};
