import { defineSchema, defineTable } from "convex/server";
import { v } from "convex/values";

export default defineSchema({
  text: defineTable({
    slug: v.literal("only"),
    value: v.string(),
  }).index("by_slug", ["slug"]),
});

