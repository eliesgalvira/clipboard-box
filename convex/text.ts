import { mutation, query } from "./_generated/server";
import { v } from "convex/values";

export const save = mutation({
  args: {
    value: v.string(),
  },
  returns: v.null(),
  handler: async (ctx, args) => {
    const updatedAt = Date.now();
    const existing = await ctx.db
      .query("text")
      .withIndex("by_slug", (q) => q.eq("slug", "only"))
      .unique();

    if (existing) {
      await ctx.db.patch(existing._id, { value: args.value, updatedAt });
    } else {
      await ctx.db.insert("text", { slug: "only", value: args.value, updatedAt });
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

export const getByPassword = query({
  args: { password: v.string() },
  returns: v.string(),
  handler: async (ctx, args) => {
    const existing = await ctx.db
      .query("text")
      .withIndex("by_password", (q) => q.eq("password", args.password))
      .unique();
    return existing?.value ?? "";
  },
});

export const saveByPassword = mutation({
  args: { password: v.string(), value: v.string() },
  returns: v.null(),
  handler: async (ctx, args) => {
    const updatedAt = Date.now();
    const existing = await ctx.db
      .query("text")
      .withIndex("by_password", (q) => q.eq("password", args.password))
      .unique();
    const value = args.value.slice(0, 10000);
    if (existing) {
      await ctx.db.patch(existing._id, { value, updatedAt });
    } else {
      await ctx.db.insert("text", { password: args.password, value, updatedAt });
    }
    return null;
  },
});

export const ensureByPassword = mutation({
  args: { password: v.string() },
  returns: v.object({ created: v.boolean() }),
  handler: async (ctx, args) => {
    const updatedAt = Date.now();
    const existing = await ctx.db
      .query("text")
      .withIndex("by_password", (q) => q.eq("password", args.password))
      .unique();
    if (existing) {
      return { created: false };
    }
    await ctx.db.insert("text", { password: args.password, value: "", updatedAt });
    return { created: true };
  },
});
