# MiniGQL - A Minimalist Nodejs Graphql Server

Setting up a nodejs graphql server should be simple, right?

## Setup

***IMPORTANT***
Before you get started, just remember that this framework requires at least 1 Query and 1 Mutation to get it running.

### Install

```bash
npm install @mavvy/minigql
```

install typescript
```bash
npm install typescript @types/node --save-dev
```

### package.json

Set type to module
```json
{
  "type": "module"
}
```

### Add script to package.json
```javascript
  {
    "scripts": {
      "start": "minigql start"
    }
  }
```

### sample tsconfig.json file
```json
{
  "compilerOptions": {
    "lib": ["es2020"],
    "target": "es2020",
    "module": "esnext",
    "moduleResolution": "node",
    "esModuleInterop": true,
    "types": ["node"]
  }
}
```

### Add .env

```bash
export PORT = 3000
```

### Add schema

create a schema.ts file under src directory

```typescript
// src/schema.ts

export default `
  type Todo {
    name: String
  }

  input AddTodoInput {
    name: String!
  }
`

```

### Add resolvers

create the files under src/resolvers directory

```typescript
// src/resolvers/todos.ts
export const resolverType = 'Query';

export const returnType = '[Todo]';

export const handler = async () => {
  return [{
    name: 'My Todo One'
  }];
}
```

#### Resolver options

##### resolverType
Optional. Resolver type: currently supported types are `Query` and `Mutation`. `Subscription` soon. Default is Query.

```javascript
export const resolverType = 'Query';
```

##### returnType

Optional. The return type of the gql resolver that is defined on your `schema.ts` file.

```javascript
export const returnType = '[Product]';
```

##### inputVariable
Optional. input type name for the resolver argument named input

```javascript
export const inputVariable = 'NameInput!';
```
Note: Make sure you define the NameInput on your schema.ts file like so:
```javascript
//src/schema.ts
export default `
  input NameInput {
    name: String
  }
`
```
On your resolver, you can access it via params
```javascript
export const resolver = async ({input}) => {
  console.log(input); // {name: 'foo'}
}
```

##### handler

Required. The main resolver function to execute
```javascript
export const handler = async () => {
  return {name: 'foo'}
}
```
###### handler params
|key|description|
|---|-----------|
|parentContext|The return value of the resolver for this field's parent
|variables|An object that contains all GraphQL arguments provided for this field|
|input|Shortcut for the input property from the variables. Same as `variables.input`|
|context|An object shared across all resolvers that are executing for a particular operation. |
|info|Contains information about the operation's execution state, including the field name, the path to the field from the root, and more.|

```javascript
export const handler = async (handlerParams) => {
  console.log(handlerParams.input);
}
```
## Advanced Configuration

### Apollo Config

Create a server.ts file under src directory

```javascript
// src/server.ts
import { InMemoryLRUCache } from '@apollo/utils.keyvaluecache';

export const apolloConfig = {
  cache: new InMemoryLRUCache(),
};
```

### serverConfig

Apollo standAloneServer config

```javascript
// src/server.ts

const getToken = (req) => req.headers.authentication;

export const serverConfig = {
  context: async ({ req }) => ({
    token: getToken(req),
  }),
}
```

### preStart function
Good location for running a database connection. etc.

```javascript
// src/server.ts
import mongoose from 'mongoose';

export async function preStart() {
  await mongoose.connect(process.env.MONGO_URI);
  console.log('connected to db');
}
```

