export type Resolver = {
  resolverType?: 'Query' | 'Mutation';
  inputVariable?: string;
  returnType?: string;
  handler: Function;
  name: string;
};

type ResolverParam = { [k: string]: any };

export type AppConfig = {
  plugins?: Plugin[];
};

export type Plugin = {
  name: string;
  resolverParam?: ResolverParam;
  context?: ({ req }: { req: any }) => Promise<any>;
  schema?: string;
  preStart?: () => Promise<any>;
};

export type ServeOptions = {
  buildDir: string;
  config?: AppConfig;
};

export type ServeProps = {
  resolvers: {
    schema: string;
    query: { [s: string]: Function };
    mutation: { [s: string]: Function };
  };
  schema: string;
};
