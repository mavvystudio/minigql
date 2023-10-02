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

const createResolverFunc = (current: Resolver, services: any) => {
  return {
    [current.name]: (
      parentContext: any,
      variables: any,
      context: any,
      info: any,
    ) =>
      current.handler({
        services,
        variables,
        parentContext,
        context,
        input: variables?.input,
        info,
      }),
  };
};

const createServices = (s?: string) => {
  if (!s) {
    return null;
  }
  const arr = s.split(',');
  const services = arr.reduce((prev, current) => {
    const [serviceName, url] = current.split('=');
    return {
      ...prev,
      [serviceName]: async (name: string, input?: any) => {
        const res = await fetch(`${url}/service`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            serviceMethod: name,
            input,
          }),
        });
        return res.json();
      },
    };
  }, {});
  return services;
};

export const createResolverSchema = (
  items: Resolver[],
  servicesInfo: string,
) => {
  const services = createServices(servicesInfo);
  const generatedData = items.reduce(
    (prev, current) => {
      const { resolverType } = current;
      const schema = createSchema(current);
      const resolverFunc = createResolverFunc(current, services);

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
