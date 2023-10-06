import path from 'path';
import fs from 'fs';

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

const createResolverFunc = (current: Resolver, services?: any) => {
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

const createServices = (s: null | ServiceItem[]) => {
  if (!s) {
    return null;
  }

  const fetcher = async (name: string, url: string, input: any) => {
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
  };
  return s.reduce(
    (prev, current) => ({
      ...prev,
      [current.name]: current.methods.reduce(
        (p, c) => ({
          ...p,
          [c]: (input?: any) => fetcher(c, current.url, input),
        }),
        {},
      ),
    }),
    {},
  );
};

type ServiceItem = {
  name: string;
  url: string;
  methods: string[];
};

const getServices = (fileData: string | null) => {
  if (!fileData) {
    return null;
  }
  const jsonData = JSON.parse(fileData);
  const servicesData = Object.entries(jsonData).reduce(
    (prev, current: [string, any]) =>
      prev.concat({
        name: current[0],
        url: current[1].url,
        methods: current[1].methods,
      }),
    [] as ServiceItem[],
  );

  return servicesData;
};

export const createResolverSchema = async (
  items: Resolver[],
  servicesConfigFile: null | string,
) => {
  const servicesData = getServices(servicesConfigFile);
  const services = createServices(servicesData);
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
