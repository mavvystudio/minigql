import { Resolver, Plugin, AppConfig } from './types';

const capitalizeFirstLetter = (str: string) => {
  return `${str.charAt(0).toUpperCase()}${str.slice(1)}`;
};

const defaultPlugin = {};
const defaultResolverType = 'Query';
const mutationPrefixes = [
  'create',
  'add',
  'insert',
  'update',
  'edit',
  'remove',
  'delete',
  'upload',
  'login',
  'register',
  'send',
];

const getResolverType = (item: Resolver) => {
  if (item.resolverType) {
    return item.resolverType;
  }

  const hasMutationPrefix = mutationPrefixes.find(
    (d) => item.name.toLowerCase().indexOf(d) === 0,
  );

  if (hasMutationPrefix) {
    return 'Mutation';
  }
  return defaultResolverType;
};

const createGqlType = (
  resolverType: Resolver['resolverType'],
  schema: string[],
) => `type ${resolverType} {
  ${schema.join('\n')}
}
`;

const createInputVariable = (current: Resolver, schema: string) => {
  if (current.inputVariable) {
    return current.inputVariable;
  }
  if (current.name.indexOf('ById') > -1) {
    return 'IdInput!';
  }
  const nameToInputName = `${capitalizeFirstLetter(current.name)}Input`;
  if (schema.indexOf(nameToInputName) > -1) {
    return `${nameToInputName}!`;
  }
  return null;
};

const createReturnTypeFromById = (name: string) => {
  const n = name.replace('ById', '');
  return capitalizeFirstLetter(n);
};

const createReturnType = (item: Resolver) => {
  if (item.returnType) {
    return item.returnType;
  }
  const isById = item.name.indexOf('ById') > -1;
  if (isById) {
    const byIdResult = createReturnTypeFromById(item.name);
    return byIdResult;
  }
  const data = mutationPrefixes.reduce(
    (prev, current) => {
      if (prev.result) {
        return prev;
      }
      if (prev.name.indexOf(current) === 0) {
        return {
          name: prev.name,
          result: capitalizeFirstLetter(prev.name.slice(current.length)),
        };
      }
      return prev;
    },
    { name: item.name.toLowerCase(), result: '' },
  );
  if (data.result) {
    return data.result;
  }
  if (data.name.slice(data.name.length - 1) === 's') {
    return `[${capitalizeFirstLetter(data.name).slice(0, -1)}]`;
  }
  return '';
};

const createSchema = (current: Resolver, schema: string) => {
  const inputVariable = createInputVariable(current, schema);
  const returnType = createReturnType(current);

  if (!inputVariable) {
    return {
      schema: `${current.name}:${returnType}`,
      returnType,
    };
  }

  return {
    schema: `${current.name}(input: ${inputVariable}):${returnType}`,
    returnType,
  };
};

const createResolverFunc = (
  current: Resolver,
  plugins: any,
  opt: { schema: string; returnType: string },
) => {
  return {
    [current.name]: (
      parentContext: any,
      variables: any,
      context: any,
      info: any,
    ) => {
      const handlerProps = {
        variables,
        parentContext,
        context,
        input: variables?.input,
        info,
        ...opt,
      };

      const pluginParams = Object.entries(plugins).reduce((prev, current) => {
        const [_k, v]: [string, any] = current;
        if (typeof v === 'function') {
          return {
            ...prev,
            ...v(handlerProps),
          };
        }
        return {
          ...prev,
          ...v,
        };
      }, {});

      return current.handler({
        ...pluginParams,
        ...handlerProps,
      });
    },
  };
};

const mergeResolversWithPlugin = (
  resolvers: Resolver[],
  plugins?: AppConfig[],
) => {
  const pluginResolvers = plugins?.map((d) => d.resolvers).filter((d) => d);
  if (!pluginResolvers || !pluginResolvers?.length) {
    return resolvers;
  }

  return pluginResolvers.reduce(
    (prev, current) => prev!.concat(current!),
    resolvers,
  );
};

const createResolverParamsPlugins = (plugins?: Plugin[]) => {
  if (!plugins) {
    return defaultPlugin;
  }
  return plugins.reduce(
    (prev, current) => ({
      ...prev,
      [current.name]: current.resolverParam,
    }),
    defaultPlugin,
  );
};

export const createResolverSchema = async (
  items: Resolver[],
  schema: string,
  config?: AppConfig[],
) => {
  const resolverParamsFromPlugin = createResolverParamsPlugins(config);
  const resolversWithPlugin = mergeResolversWithPlugin(items, config);

  const generatedData = resolversWithPlugin!.reduce(
    (prev: any, current: any) => {
      const targetType = getResolverType(current);
      const generatedSchema = createSchema(current, schema);
      const resolverFunc = createResolverFunc(
        current,
        resolverParamsFromPlugin,
        generatedSchema,
      );

      const query = targetType === 'Query' ? resolverFunc : {};
      const mutation = targetType === 'Mutation' ? resolverFunc : {};

      return {
        querySchema:
          targetType === 'Query'
            ? prev.querySchema.concat(generatedSchema.schema)
            : prev.querySchema,
        mutationSchema:
          targetType === 'Mutation'
            ? prev.mutationSchema.concat(generatedSchema.schema)
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
