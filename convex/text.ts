import { mutation, query } from "./_generated/server";
import { v } from "convex/values";

export const save = mutation({
  args: {
    value: v.string(),
  },
  returns: v.null(),
  handler: async (ctx, args) => {
    const existing = await ctx.db
      .query("text")
      .withIndex("by_slug", (q) => q.eq("slug", "only"))
      .unique();

    if (existing) {
      await ctx.db.patch(existing._id, { value: args.value });
    } else {
      await ctx.db.insert("text", { slug: "only", value: args.value });
    }
    return null;
  },
});

export const get = query({
  args: {},
  returns: v.string(),
  handler: async (ctx) => {
    const existing = await ctx.db
      .query("text")
      .withIndex("by_slug", (q) => q.eq("slug", "only"))
      .unique();
    return existing?.value ?? "";
  },
});

