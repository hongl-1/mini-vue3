import { mutableHandles, readonlyHandles, shallowReadonlyHandlers } from './baseHandler'
import { isObject, warn } from '../shared'

export const enum ReactiveFlags {
  IS_REACTIVE = '__v_isReactive',
  IS_READONLY = '__v_isReadonly'
}

export function reactive(raw) {
  return createActiveObject(raw, mutableHandles)
}

export function readonly(raw) {
  return createActiveObject(raw, readonlyHandles)
}

export function shallowReadonly(raw) {
  return createActiveObject(raw, shallowReadonlyHandlers)
}

export function isReactive(value) {
  if(!value) return false
  return !!value[ReactiveFlags.IS_REACTIVE]
}

export function isReadonly(value) {
  if(!value) return false
  return !!value[ReactiveFlags.IS_READONLY]
}

export function isProxy(value) {
  return isReactive(value) || isReadonly(value)
}

function createActiveObject(target, baseHandler) {
  if(!isObject(target)) {
    warn(`target, ${target} must be a object when create a proxy`)
    return target
  }
  return new Proxy(target, baseHandler)
}
