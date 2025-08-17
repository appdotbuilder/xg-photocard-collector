import { initTRPC } from '@trpc/server';
import { createHTTPServer } from '@trpc/server/adapters/standalone';
import 'dotenv/config';
import cors from 'cors';
import superjson from 'superjson';
import { z } from 'zod';

// Import schemas
import { 
  parseFilenameInputSchema,
  createPhotocardInputSchema,
  photocardFilterSchema,
  addToCollectionInputSchema,
  updateUserPhotocardInputSchema
} from './schema';

// Import handlers
import { parseFilename } from './handlers/parse_filename';
import { createPhotocard } from './handlers/create_photocard';
import { getPhotocards } from './handlers/get_photocards';
import { addToCollection } from './handlers/add_to_collection';
import { getUserCollection } from './handlers/get_user_collection';
import { getUserPhotocard } from './handlers/get_user_photocard';
import { updateUserPhotocard } from './handlers/update_user_photocard';
import { removeFromCollection } from './handlers/remove_from_collection';
import { bulkImportPhotocards } from './handlers/bulk_import_photocards';

const t = initTRPC.create({
  transformer: superjson,
});

const publicProcedure = t.procedure;
const router = t.router;

const appRouter = router({
  // Health check
  healthcheck: publicProcedure.query(() => {
    return { status: 'ok', timestamp: new Date().toISOString() };
  }),

  // Parse filename for auto-filling photocard details
  parseFilename: publicProcedure
    .input(parseFilenameInputSchema)
    .mutation(({ input }) => parseFilename(input)),

  // Master catalog operations
  createPhotocard: publicProcedure
    .input(createPhotocardInputSchema)
    .mutation(({ input }) => createPhotocard(input)),

  getPhotocards: publicProcedure
    .input(photocardFilterSchema.optional())
    .query(({ input }) => getPhotocards(input)),

  bulkImportPhotocards: publicProcedure
    .input(z.array(createPhotocardInputSchema))
    .mutation(({ input }) => bulkImportPhotocards(input)),

  // User collection operations
  addToCollection: publicProcedure
    .input(addToCollectionInputSchema)
    .mutation(({ input }) => addToCollection(input)),

  getUserCollection: publicProcedure
    .input(z.object({ userId: z.string() }))
    .query(({ input }) => getUserCollection(input.userId)),

  getUserPhotocard: publicProcedure
    .input(z.object({ id: z.number(), userId: z.string() }))
    .query(({ input }) => getUserPhotocard(input.id, input.userId)),

  updateUserPhotocard: publicProcedure
    .input(updateUserPhotocardInputSchema)
    .mutation(({ input }) => updateUserPhotocard(input)),

  removeFromCollection: publicProcedure
    .input(z.object({ id: z.number(), userId: z.string() }))
    .mutation(({ input }) => removeFromCollection(input.id, input.userId)),
});

export type AppRouter = typeof appRouter;

async function start() {
  const port = process.env['SERVER_PORT'] || 2022;
  const server = createHTTPServer({
    middleware: (req, res, next) => {
      cors()(req, res, next);
    },
    router: appRouter,
    createContext() {
      return {};
    },
  });
  server.listen(port);
  console.log(`TRPC server listening at port: ${port}`);
}

start();