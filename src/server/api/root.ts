import { createCallerFactory, createTRPCRouter } from '~/server/api/trpc'
import { usersRouter } from '~/server/api/routers/user'
import { messagesRouter } from '~/server/api/routers/messages'
import { authRouter } from '~/server/api/routers/auth'

/**
 * This is the primary router for your server.
 *
 * All routers added in /api/routers should be manually added here.
 */
export const appRouter = createTRPCRouter({
  user: usersRouter,
  messages: messagesRouter,
  auth: authRouter
})

// export type definition of API
export type AppRouter = typeof appRouter

/**
 * Create a server-side caller for the tRPC API.
 * @example
 * const trpc = createCaller(createContext);
 * const res = await trpc.post.all();
 *       ^? Post[]
 */
export const createCaller = createCallerFactory(appRouter)
