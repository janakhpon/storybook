import { transformFromAstAsync, Node, BabelFileResult } from '@babel/core';
import { RawSourceMap } from 'source-map';
import traverse from '@babel/traverse';
import { parse } from '@babel/parser';

const createAST = (source: string) => {
  return parse(source, { sourceType: 'module', plugins: ['jsx'] });
};

export interface Result {
  code: BabelFileResult['code'];
  map: BabelFileResult['map'];
}

const shake = async (ast: Node, source: string, inputSourceMap: RawSourceMap) => {
  const { code, map } = await transformFromAstAsync(ast, source, {
    sourceType: 'module',
    inputSourceMap,
    sourceMaps: !!inputSourceMap,
    plugins: ['minify-dead-code-elimination'],
  });
  return { code, map };
};

export const transform = async (
  source: string,
  map: RawSourceMap,
  options: {}
): Promise<Result> => {
  const ast = createAST(source);
  let exportDefaultPath;

  traverse(ast, {
    ExportDefaultDeclaration(p) {
      exportDefaultPath = p;
    },
    Identifier(p) {
      // eslint-disable-next-line no-param-reassign
      p.node.name = p.node.name
        .split('')
        .reverse()
        .join('');
    },
  });

  return shake(ast, source, map);
};
