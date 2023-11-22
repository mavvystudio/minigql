import fs from 'fs';
import path from 'path';
import { ApolloServer } from '@apollo/server';
import { startStandaloneServer } from '@apollo/server/standalone';
import { Plugin, ServeOptions, ServeProps } from './types';

const PORT = Number(process.env.PORT);

const defaultSchema = `
input IdInput {
  id: ID!
}
`;
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

const getContext = (plugins?: Plugin[]) => {
  if (!plugins) {
    return undefined;
  }
  const target = plugins.find((d) => d.context);
  if (!target) {
    return undefined;
  }
  return target.context;
};

export const serve = async (
  { resolvers, schema }: ServeProps,
  options: ServeOptions,
) => {
  const serverFile = await getServerApp(options.buildDir);
  const apolloConfig = serverFile?.apolloConfig || {};
  const serverConfig = serverFile?.serverConfig || {};

  if (serverFile && serverFile.preStart) {
    await serverFile.preStart();
  }

  const server = new ApolloServer({
    typeDefs: defaultSchema.concat(schema).concat(resolvers.schema),
    resolvers: {
      Query: resolvers.query,
      Mutation: resolvers.mutation,
    },
    ...apolloConfig,
  });

  const c = getContext(options.config?.plugins);
  const { url } = await startStandaloneServer(server, {
    listen: { port: PORT },
    context: c,
    ...serverConfig,
  });

  console.log(`🚀  Server ready at: ${url}`);
};
