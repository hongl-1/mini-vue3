import { createComponentInstance, setupComponent } from './component'
import { isObject } from '../shared'

export function render(vnode, container) {
  // patch
  patch(vnode, container)
}

function patch(vnode, container) {
  // 判断是组件类型还是 element 类型
  if(typeof vnode.type === 'string') {
    // element 类型直接走处理元素的逻辑
    processElement(vnode, container)
  } else if(isObject(vnode.type)) {
    // component 类型走处理组件逻辑
    processComponent(vnode, container)
  }
}

function processComponent(vnode, container) {
  mountComponent(vnode, container)
}

// 挂载组件流程
function mountComponent(vnode, container) {
  // 返回一个组件实例
  const instance = createComponentInstance(vnode)
  // 处理组件的setup逻辑
  setupComponent(instance) // 执行完以后会初始化instance setup 并且再instance上添加render方法
  // 将组件的render和组件的setup进行关联
  setupRenderEffect(instance, container)
}

// 处理元素分支
function processElement(vnode, container) {
  mountElement(vnode, container)
}

function mountElement(vnode, container) {
  // 创建当前分支节点
  const el = document.createElement(vnode.type)
  const { children } = vnode
  if (typeof children === 'string') {
    el.textContent = children
  } else if (Array.isArray(children)) {
    mountChildren(vnode, el)
  }
  // 将当前分支节点挂载在父级节点上
  container.append(el)
}

// 递归处理子集
function mountChildren(vnode, container) {
  vnode.children.forEach((v) => {
    patch(v, container)
  })
}
// 将setup的值和render函数关联起来
function setupRenderEffect(instance, container) {
  const { proxy } = instance
  const subTree = instance.render.call(proxy)

  patch(subTree, container)
}
