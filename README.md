# MiniGQL - A Minimalist Nodejs Graphql Server

Setting up a nodejs graphql server should be simple.

## Setup

### Install

```bash
npm install @mavvy/minigql @apollo/server graphql
```

### Add script to package.json
```javascript
  {
    "scripts": {
      "start": "minigql start"
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
Resolver type: currently supported types are `Query` and `Mutation`. `Subscription` soon.

```javascript
export const resolverType = 'Query';
```

##### returnType

The return type of the gql resolver that is defined on your `schema.ts` file.

```javascript
export const returnType = '[Product]';
```

##### inputVariable
input type name for the resolver argument named input
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

The main resolver function to execute
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
|services| An object the contains all the services that are defined on your `env` file. see [miniserver integration](#integration-with-mavvyminiserver) for more info.

```javascript
export const handler = asnc (handperParams) => {
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

export async function handler() {
  await mongoose.connect(process.env.MONGO_URI);
  console.log('connected to db');
}
```

## Integration with @mavvy/miniserver

### Configuration
add SERVICES to `.env` file

```bash
export SERVICES = product=http://localhost:3001,cart=http://localhost:3002
```

### Usage
Call the service on you resolver
```javascript
// resolver/myProducts
export const resolverType = 'Query';

export const returnType = '[Product]';

export const handler = async ({services}) => {
  const res = services.product('productList');

  return res.data;
}
```

#### @mavvy/miniserver handler

```javascript
// handlers/productList.ts

export async function handler({ currentModel }) {
  const data = await currentModel.find();

  return data.map((doc: any) => ({
    id: doc.id,
    name: doc.name,
  }));
}
```

See more on [@mavvy/miniserver](https://github.com/mavvy22/miniserver)