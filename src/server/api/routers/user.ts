import { z } from "zod";

import {
  createTRPCRouter,
  protectedProcedure,
  publicProcedure,
} from "~/server/api/trpc";
import { eq } from "drizzle-orm";
import { channels, channelMembers } from "~/server/db/schema";

export const usersRouter = createTRPCRouter({
  getUserChannels: publicProcedure
    .input(z.object({ userId: z.string() }))
    .query(async ({ input, ctx }) => {
      const userChannels = await ctx.db
        .select({
          id: channels.id,
          name: channels.name,
          description: channels.description,
          isPrivate: channels.isPrivate,
          createdAt: channels.createdAt,
        })
        .from(channelMembers)
        .innerJoin(channels, eq(channelMembers.channelId, channels.id))
        .where(eq(channelMembers.userId, input.userId));

      return userChannels || [];
    }),
});
