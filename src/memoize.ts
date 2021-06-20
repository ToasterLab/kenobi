import MemoizeFS from 'memoize-fs'

const defaultMaxAge = 1000 * 60 * 60 * 24 * 7 // a week

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type PromiseFunction = (...arguments_: any[]) => Promise<any>
// type ThenArgument<T> = T extends PromiseLike<infer U> ? U : T

const Memoize = <InputFunction extends PromiseFunction>(
  function_: InputFunction,
  options = {} as MemoizeFS.MemoizeOptions,
) => async (...arguments_: Parameters<InputFunction>) => {
  const {
    maxAge = defaultMaxAge,
    force = false,
  } = options
  const memoizer = MemoizeFS({ cachePath: `./cache` , force, maxAge })
  return await (await memoizer.fn(function_))(...arguments_)
}

export default Memoize