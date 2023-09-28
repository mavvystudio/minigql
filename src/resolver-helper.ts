type Resolver = {
  resolverType: 'Query' | 'Mutation';
  inputVariable?: string;
  returnType: string;
  handler: Function;
  service?: string;
  name: string;
};

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

const createResolverFunc = (current: Resolver) => {
  return { [current.name]: current.handler };
};
export const createResolverSchema = (items: Resolver[]) => {
  const generatedData = items.reduce(
    (prev, current) => {
      const { resolverType } = current;
      const schema = createSchema(current);
      const resolverFunc = createResolverFunc(current);

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
