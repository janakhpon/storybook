import { RawSourceMap } from 'source-map';
import { transform, Result } from './babel-plugin';

import { Loader } from '../../types/webpack';

const managerEntryloader = function managerEntryloader(
  source: string,
  inputSourceMap: RawSourceMap
) {
  const callback = this.async();
  // this.cacheable(true);

  console.log('loader was executed!');

  transform(source, inputSourceMap, {}).then(({ code, map }: Result) => {
    console.log('loader returned result!');
    console.log(code);
    callback(null, `${code}; console.log("here")`, map);
    // return callback(null, code, map);
  });
} as Loader;

export { managerEntryloader as default };

console.log('loader was loaded!');
