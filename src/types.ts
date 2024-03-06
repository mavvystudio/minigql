export type Resolver = {
  resolverType?: 'Query' | 'Mutation';
  inputVariable?: string;
  returnType?: string;
  handler: Function;
  name: string;
};

type ResolverParam = { [k: string]: any };

export type AppConfig = {
  resolvers: any;
  resolverParam: any;
  name: any;
  context: any;
  preStart: any;
  schema: any;
};

export type Plugin = {
  name: string;
  resolverParam?: ResolverParam;
  context?: ({ req }: { req: any }) => Promise<any>;
  schema?: string;
  preStart?: () => Promise<any>;
  resolvers?: Resolver[];
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
