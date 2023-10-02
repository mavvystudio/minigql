#!/usr/bin/env node

import * as fs from 'fs';
import path from 'path';
import { execSync, spawn } from 'child_process';

const buildDir = '.minigql';
const argv = process.argv;

if (argv[2] === 'start') {
  execSync(`rm -rf ${buildDir} && tsc --outDir "${buildDir}"`);

  const fileContent = `import * as service from '@mavvy/minigql';
import schema from './schema.js'; 

const buildDir = '${buildDir}';
const init = async () => {

  const services = process.env.SERVICES;
  const resolverInfo = await service.utils.link(process.cwd(), '${buildDir}/resolvers');
  const resolvers = service.resolverHelper.createResolverSchema(resolverInfo, services);

  const options = {
    buildDir,
  };
  service.server.serve({resolvers, schema, services}, options);
}

init();
`;
  const filePath = path.join(buildDir, 'index.js');

  fs.writeFileSync(filePath, fileContent);

  const runner = spawn(`node ${buildDir}/index.js`, { shell: true });

  runner.stdout.on('data', (data) => console.log(data.toString()));
  runner.stderr.on('data', (data) => console.log(data.toString()));

  process.on('SIGINT', () => {
    process.exit();
  });
}
