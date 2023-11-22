#!/usr/bin/env node

import * as fs from 'fs';
import fse from 'fs-extra';
import path from 'path';
import { execSync, spawn } from 'child_process';

const buildDir = '.minigql';
const configFile = 'minigql.config.js';
const argv = process.argv;

if (argv[2] === 'start') {
  fse.emptyDirSync(buildDir);
  execSync(`tsc --outDir "${buildDir}"`);

  const fileContent = `import * as service from '@mavvy/minigql';
import path from 'path';
import schema from './schema.js'; 

const buildDir = '${buildDir}';
const init = async () => {

  const resolverFile = await service.utils.link(process.cwd(), '${buildDir}/resolvers');
  const appConfig = await service.utils.importJs(path.join(process.cwd(), '${configFile}'));
  const resolvers = await service.resolverHelper.createResolverSchema(resolverFile, schema, appConfig);

  const options = {
    buildDir,
    config: appConfig
  };
  service.server.serve({resolvers, schema}, options);
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
