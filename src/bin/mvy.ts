#!/usr/bin/env node

import * as fs from 'fs';
import path from 'path';
import { exec, execSync, spawn } from 'child_process';

const buildDir = '.mvy';
const argv = process.argv;

if (argv[2] === 'dev') {
  execSync(`rm -rf ${buildDir} && tsc --outDir "${buildDir}"`);

  const fileContent = `import * as service from '@mavvy/microservices-gateway';
import schema from './schema.js'; 

const init = async () => {

  const resolverInfo = await service.utils.link(process.cwd(), '.mvy/resolvers');
  const resolvers = service.resolverHelper.createResolverSchema(resolverInfo);

  service.server.serve({resolvers, schema});
}

init();
`;
  const filePath = path.join('.mvy', 'index.js');

  fs.writeFileSync(filePath, fileContent);

  const runner = spawn('node .mvy/index.js', { shell: true });

  runner.stdout.on('data', (data) => console.log(data.toString()));
  runner.stderr.on('data', (data) => console.log(data.toString()));

  process.on('SIGINT', () => {
    process.exit();
  });
}
