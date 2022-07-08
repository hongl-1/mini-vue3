import { track, trigger } from './effect'
import { isObject, warn } from '../shared'
import { reactive, ReactiveFlags, readonly } from './reactive'

const get = createGetter()
const set = createSetter()
const readonlyGet = createGetter(true)

function createGetter(isReadonly = false) {
  return function(target, key) {
    const res = Reflect.get(target, key)

    if (key === ReactiveFlags.IS_REACTIVE) {
      return !isReadonly
    } else if (key === ReactiveFlags.IS_READONLY) {
      return isReadonly
    }

    if(isObject(res)) {
      return isReadonly ? readonly(res) : reactive(res)
    }

    if(!isReadonly) {
      // 依赖收集
      track(target, key)
    }
    return res
  }
}

function createSetter() {
  return function (target, key, value) {
    const result = Reflect.set(target, key, value)
    // 触发依赖更新
    trigger(target, key)
    return result
  }
}

export const mutableHandle = {
  get,
  set
}

export const readonlyHandle = {
  get: readonlyGet,
  set (target, key) {
    warn(`${key as string} is readonly, cannot been set, target:${target}`)
    return true
  }
}
