/* eslint-disable @typescript-eslint/no-object-literal-type-assertion */
import { ConfigCollector, Config } from '../types/config';
import * as config from './config';

const base: ConfigCollector = {
  entries: [],
  logLevel: [],
  template: [],
  managerTemplate: [],
  webpack: [],
  managerWebpack: [],
  server: [],
  output: [],
};

describe('addPresetToCollection', () => {
  it('should not throw on empty', () => {
    const stage0: ConfigCollector = base;

    expect(() => config.addPresetToCollection(stage0, async () => ({}))).not.toThrow();
  });
  it('should not add undefined', async () => {
    const stage0: ConfigCollector = base;

    expect(
      await config.addPresetToCollection(stage0, async () => ({ entries: undefined }))
    ).toEqual({
      ...base,
      entries: [],
    });
  });
  it('should not mutate', async () => {
    const stage0: ConfigCollector = base;

    const result = await config.addPresetToCollection(stage0, async () => ({ entries: ['foo'] }));

    expect(base.entries).toEqual([]);
    expect(result.entries).toEqual([['foo']]);
  });
  it('empty should stay empty', async () => {
    const stage0: ConfigCollector = base;

    expect(await config.addPresetToCollection(stage0, async () => ({}))).toEqual(base);
  });
  it('add things to the collection - array', async () => {
    const stage0: ConfigCollector = base;

    expect(await config.addPresetToCollection(stage0, async () => ({ entries: ['foo'] }))).toEqual({
      ...base,
      entries: [['foo']],
    });
  });
  it('add things to the collection - array 2', async () => {
    const stage0: ConfigCollector = base;

    expect(
      await config.addPresetToCollection(stage0, async () => ({ entries: ['foo', 'bar'] }))
    ).toEqual({
      ...base,
      entries: [['foo', 'bar']],
    });
  });
  it('add things to the collection - over multiple presets', async () => {
    const stage0: ConfigCollector = base;
    const stage1 = await config.addPresetToCollection(stage0, async () => ({
      entries: ['foo', 'bar'],
    }));
    const stage2 = await config.addPresetToCollection(stage1, async () => ({ entries: ['baz'] }));

    expect(stage2).toEqual({
      ...base,
      entries: [['foo', 'bar'], ['baz']],
    });
  });
  it('add multiple things to the collection - over multiple presets', async () => {
    const stage0: ConfigCollector = base;
    const stage1 = await config.addPresetToCollection(stage0, async () => ({
      entries: ['foo', 'bar'],
    }));
    const stage2 = await config.addPresetToCollection(stage1, async () => ({ entries: ['baz'] }));

    expect(stage2).toEqual({
      ...base,
      entries: [['foo', 'bar'], ['baz']],
    });
  });
  it('add additionals', async () => {
    const stage0: ConfigCollector = base;
    const stage1 = await config.addPresetToCollection(
      stage0,
      async () => ({
        entries: ['foo', 'bar'],
      }),
      [
        async () => ({
          entries: ['baz'],
        }),
      ]
    );

    expect(stage1).toEqual({
      ...base,
      entries: [['foo', 'bar'], ['baz']],
    });
  });
  it('add additionals 2', async () => {
    const stage0: ConfigCollector = base;
    const stage1 = await config.addPresetToCollection(
      stage0,
      async () => ({
        entries: ['foo', 'bar'],
      }),
      [
        async () => ({
          entries: ['baz'],
        }),
        async () => ({
          entries: ['fizz'],
        }),
      ]
    );

    expect(stage1).toEqual({
      ...base,
      entries: [['foo', 'bar'], ['baz'], ['fizz']],
    });
  });
  it('add additionals 3', async () => {
    const stage0: ConfigCollector = base;
    const stage1 = await config.addPresetToCollection(
      stage0,
      async () => ({
        entries: ['foo', 'bar'],
      }),
      [
        async () => ({
          entries: ['baz'],
        }),
        {
          entries: ['fizz'],
        },
      ]
    );

    expect(stage1).toEqual({
      ...base,
      entries: [['foo', 'bar'], ['baz'], ['fizz']],
    });
  });
});

describe('addPropertyToCollector', () => {
  it('should not throw on empty', () => {
    const stage0: ConfigCollector = base;

    expect(() => config.addPropertyToCollector(stage0, ['entries', undefined])).not.toThrow();
  });
  it('should not mutate', () => {
    const stage0: ConfigCollector = base;

    const result = config.addPropertyToCollector(stage0, ['entries', ['foo']]);

    expect(stage0.entries).toEqual([]);
    expect(result.entries).toEqual([['foo']]);
  });
  it('should merge in property', () => {
    const stage0: ConfigCollector = base;

    expect(config.addPropertyToCollector(stage0, ['entries', ['baz']])).toEqual({
      ...base,
      entries: [['baz']],
    });
  });
  it('should merge in property 2', () => {
    const stage0: ConfigCollector = base;

    expect(config.addPropertyToCollector(stage0, ['entries', ['baz', 'x']])).toEqual({
      ...base,
      entries: [['baz', 'x']],
    });
  });
});

describe('apply', () => {
  it('should not throw on empty', () => {
    const list: any[] = [];
    const c = {} as Config;

    expect(async () => {
      await config.apply<any>(list, c);
    }).not.toThrow();
  });

  describe('should replace primitives', () => {
    it('numbers', async () => {
      const list: any[] = [1, 2, 3];
      const c = {} as Config;

      const result = await config.apply<any>(list, c);

      expect(result).toBe(3);
    });
    it('strings', async () => {
      const list: any[] = ['1', '2', '3'];
      const c = {} as Config;

      const result = await config.apply<any>(list, c);

      expect(result).toBe('3');
    });
    it('undefined', async () => {
      const list: any[] = ['1', '2', undefined];
      const c = {} as Config;

      const result = await config.apply<any>(list, c);

      expect(result).toBe(undefined);
    });
    it('mixed', async () => {
      const list: any[] = [undefined, '2', 2];
      const c = {} as Config;

      const result = await config.apply<any>(list, c);

      expect(result).toBe(2);
    });
  });

  describe('should merge arrays', () => {
    it('simple', async () => {
      const list: any[] = [[1], [2], [3]];
      const c = {} as Config;

      const result = await config.apply<any>(list, c);

      expect(result).toEqual([1, 2, 3]);
    });
    it('some empty', async () => {
      const list: any[] = [[], [], [3]];
      const c = {} as Config;

      const result = await config.apply<any>(list, c);

      expect(result).toEqual([3]);
    });
  });

  describe('should merge objects', () => {
    it('simple', async () => {
      const list: any[] = [
        { port: 4 },
        { port: 5, host: 'localhost' },
        { host: 'localhost', middleware: [] },
      ];
      const c = {} as Config;

      const result = await config.apply<any>(list, c);

      expect(result).toEqual({
        port: 5,
        host: 'localhost',
        middleware: [],
      });
    });
    it('some empty', async () => {
      const list: any[] = [
        {},
        {},
        { port: 4 },
        { port: 5, host: 'localhost' },
        { host: 'localhost', middleware: [] },
      ];
      const c = {} as Config;

      const result = await config.apply<any>(list, c);

      expect(result).toEqual({
        port: 5,
        host: 'localhost',
        middleware: [],
      });
    });
  });

  describe('should call functions', () => {
    it('should call functions with previous value & config', async () => {
      const spy = jest.fn((a, b) => Promise.resolve({ ...a, port: 4 }));

      const list: any[] = [async () => Promise.resolve({ port: 1 }), spy, spy];
      const c = {} as Config;
      const result = await config.apply<any>(list, c);

      expect(spy).toHaveBeenCalledTimes(2);
      expect(spy).toHaveBeenNthCalledWith(1, { port: 1 }, c);
      expect(spy).toHaveBeenNthCalledWith(2, { port: 4 }, c);

      expect(result).toEqual({ port: 4 });
    });
    it('sync merger functions', async () => {
      const list: any[] = [(a: object) => ({ ...a, port: 4 }), (a: object) => ({ ...a, port: 5 })];
      const c = {} as Config;

      const result = await config.apply<any>(list, c);

      expect(result).toEqual({
        port: 5,
      });
    });
    it('async merger functions', async () => {
      const list: any[] = [
        async (a: object) => Promise.resolve({ ...a, port: 3 }),
        async (a: object) => Promise.resolve({ ...a, port: 4 }),
      ];
      const c = {} as Config;

      const result = await config.apply<any>(list, c);

      expect(result).toEqual({
        port: 4,
      });
    });
    it('mixed merger functions', async () => {
      const list: any[] = [
        async (a: object) => Promise.resolve({ ...a, port: 3 }),
        (a: object) => ({ ...a, port: 4 }),
        async (a: object) => Promise.resolve({ ...a, port: 3 }),
        (a: object) => ({ ...a, port: 4 }),
      ];
      const c = {} as Config;

      const result = await config.apply<any>(list, c);

      expect(result).toEqual({
        port: 4,
      });
    });
    it('handles a sync throwing merger function', async () => {
      const list: any[] = [
        () => {
          throw new Error('BAD');
        },
      ];
      const c = {} as Config;

      const fn = async () => {
        await config.apply<any>(list, c);
      };

      expect(fn()).rejects.toEqual(new Error('BAD'));
    });
    it('handles an async rejecting merger function', async () => {
      const list: any[] = [() => Promise.reject(new Error('BAD'))];
      const c = {} as Config;

      const fn = async () => {
        await config.apply<any>(list, c);
      };

      expect(fn()).rejects.toEqual(new Error('BAD'));
    });
  });

  describe('mixing functions & other', () => {
    it('merger function & primitive', async () => {
      const list: any[] = [1, async (a: object) => Promise.resolve(4), 6];
      const c = {} as Config;

      const result = await config.apply<any>(list, c);

      expect(result).toBe(6);
    });
    it('merger function & primitive 2', async () => {
      const list: any[] = [1, async (a: object) => Promise.resolve(4)];
      const c = {} as Config;

      const result = await config.apply<any>(list, c);

      expect(result).toBe(4);
    });
    it('merger function & primitive 3', async () => {
      const list: any[] = ['1', async (a: object) => Promise.resolve('4')];
      const c = {} as Config;

      const result = await config.apply<any>(list, c);

      expect(result).toBe('4');
    });
    it('merger function & array', async () => {
      const list: any[] = [['1'], async (a: string[]) => Promise.resolve([...a, '2'])];
      const c = {} as Config;

      const result = await config.apply<any>(list, c);

      expect(result).toEqual(['1', '2']);
    });
    it('merger function & object', async () => {
      const list: any[] = [
        { port: 5 },
        async (a: object) => Promise.resolve({ ...a, port: 4 }),
        { host: 'localhost' },
      ];
      const c = {} as Config;

      const result = await config.apply<any>(list, c);

      expect(result).toEqual({
        port: 4,
        host: 'localhost',
      });
    });
    it('primitive & merger function & object', async () => {
      const list: any[] = [
        undefined,
        async () => Promise.resolve({ port: 4 }),
        { host: 'localhost' },
      ];
      const c = {} as Config;

      const result = await config.apply<any>(list, c);

      expect(result).toEqual({
        port: 4,
        host: 'localhost',
      });
    });
  });
});
