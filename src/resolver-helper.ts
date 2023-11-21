type Resolver = {
  resolverType: 'Query' | 'Mutation';
  inputVariable?: string;
  returnType: string;
  handler: Function;
  service?: string;
  name: string;
};

type ResolverParam = { [k: string]: any };

type Plugin = { resolverParam?: ResolverParam };

const defaultPlugin = {};

const createGqlType = (
  resolverType: Resolver['resolverType'],
  schema: string[],
) => `type ${resolverType} {
  ${schema.join('\n')}
}
`;

const createSchema = (current: Resolver) => {
  if (!current.inputVariable) {
    return `${current.name}:${current.returnType}`;
  }
  return `${current.name}(input: ${current.inputVariable}):${current.returnType}`;
};

const createResolverFunc = (current: Resolver, plugins: any) => {
  return {
    [current.name]: (
      parentContext: any,
      variables: any,
      context: any,
      info: any,
    ) =>
      current.handler({
        ...plugins,
        variables,
        parentContext,
        context,
        input: variables?.input,
        info,
      }),
  };
};

const createResolverPlugins = (plugins?: Plugin[]) => {
  if (!plugins) {
    return defaultPlugin;
  }
  return plugins.reduce(
    (prev, current) => ({
      ...prev,
      ...(current.resolverParam || {}),
    }),
    defaultPlugin,
  );
};

export const createResolverSchema = async (
  items: Resolver[],
  plugins?: { default: Plugin[] },
) => {
  const resolverPlugins = createResolverPlugins(plugins?.default);

  const generatedData = items.reduce(
    (prev, current) => {
      const { resolverType } = current;
      const schema = createSchema(current);
      const resolverFunc = createResolverFunc(current, resolverPlugins);

      const query = resolverType === 'Query' ? resolverFunc : {};
      const mutation = resolverType === 'Mutation' ? resolverFunc : {};

      return {
        querySchema:
          resolverType === 'Query'
            ? prev.querySchema.concat(schema)
            : prev.querySchema,
        mutationSchema:
          resolverType === 'Mutation'
            ? prev.mutationSchema.concat(schema)
            : prev.mutationSchema,
        Query: {
          ...prev.Query,
          ...query,
        },
        Mutation: {
          ...prev.Mutation,
          ...mutation,
        },
      };
    },
    {
      querySchema: [] as string[],
      mutationSchema: [] as string[],
      Query: {},
      Mutation: {},
    },
  );

  const queryType = createGqlType('Query', generatedData.querySchema);
  const mutationType = createGqlType('Mutation', generatedData.mutationSchema);

  return {
    schema: `${queryType}${mutationType}`,
    query: generatedData.Query,
    mutation: generatedData.Mutation,
  };
};
