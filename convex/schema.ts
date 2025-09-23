import { defineSchema, defineTable } from "convex/server";
import { v } from "convex/values";

export default defineSchema({
  text: defineTable({
    // legacy single-row clipboard
    slug: v.optional(v.literal("only")),
    // per-password clipboard key
    password: v.optional(v.string()),
    value: v.string(),
  })
    .index("by_slug", ["slug"]) // legacy index remains for backward compat
    .index("by_password", ["password"]),
});

