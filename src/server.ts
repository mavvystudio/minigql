import fs from 'fs';
import path from 'path';
import { ApolloServer } from '@apollo/server';
import { startStandaloneServer } from '@apollo/server/standalone';

const PORT = Number(process.env.PORT);

type ServeProps = {
  resolvers: {
    schema: string;
    query: { [s: string]: Function };
    mutation: { [s: string]: Function };
  };
  schema: string;
};

const getServerApp = (
  buildDir: string,
): Promise<{
  apolloConfig?: any;
  serverConfig?: any;
  preStart: () => Promise<void>;
} | null> =>
  new Promise((resolver) => {
    const filePath = path.join(process.cwd(), buildDir, 'server.js');
    fs.readFile(filePath, async (err) => {
      if (!err) {
        const file = await import(filePath);
        return resolver(file);
      }
      resolver(null);
    });
  });

export const serve = async (
  { resolvers, schema }: ServeProps,
  options: { buildDir: string },
) => {
  const serverFile = await getServerApp(options.buildDir);
  const apolloConfig = serverFile?.apolloConfig || {};
  const serverConfig = serverFile?.serverConfig || {};

  if (serverFile && serverFile.preStart) {
    await serverFile.preStart();
  }

  const server = new ApolloServer({
    typeDefs: schema.concat(resolvers.schema),
    resolvers: {
      Query: resolvers.query,
      Mutation: resolvers.mutation,
    },
    ...apolloConfig,
  });

  const { url } = await startStandaloneServer(server, {
    listen: { port: PORT },
    ...serverConfig,
  });

  console.log(`🚀  Server ready at: ${url}`);
};
