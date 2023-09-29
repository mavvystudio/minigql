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

export const serve = async ({ resolvers, schema }: ServeProps) => {
  const server = new ApolloServer({
    typeDefs: schema.concat(resolvers.schema),
    resolvers: {
      Query: resolvers.query,
      Mutation: resolvers.mutation,
    },
  });

  const { url } = await startStandaloneServer(server, {
    listen: { port: PORT },
  });

  console.log(`🚀  Server ready at: ${url}`);
};
