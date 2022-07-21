import { createComponentInstance, setupComponent } from './component'
import { ShapeFlags } from '../shared/ShapeFlags'
import { Text, Fragment } from './vnode'
import { createAppAPI } from './createApp'
import { effect } from '../reactivity'
import { EMPTY_OBJ } from '../shared'

export function createRenderer (options) {

  const {
    createElement: hostCreateElement,
    patchProp: hostPatchProp,
    insert: hostInsert,
    setElementText: hostSetElementText,
    remove: hostRemove
  } = options

  function render(vnode, container) {
    // patch
    patch(null, vnode, container, null, null)
  }
  // n1 为老的vnode
  // n2 为新的vnode
  function patch(n1, n2, container, parentComponent, anchor) {
    const { shapeFlag, type } = n2

    switch (type) {
      case Fragment:
        processFragment(n1, n2, container, parentComponent, anchor)
        break
      case Text:
        processText(n1, n2, container)
        break
      default:
        // 判断是组件类型还是 element 类型
        if(shapeFlag & ShapeFlags.ELEMENT) {
          // element 类型直接走处理元素的逻辑
          processElement(n1, n2, container, parentComponent, anchor)
        } else if(shapeFlag & ShapeFlags.STATEFUL_COMPONENT) {
          // component 类型走处理组件逻辑
          processComponent(n1, n2, container, parentComponent, anchor)
        }
        break
    }
  }

  // 处理slot中的children (fragment)
  function processFragment(n1, n2, container, parentComponent, anchor) {
    mountChildren(n2.children, container, parentComponent, anchor)
  }

  // 处理文本节点
  function processText(n1, n2, container) {
    const { children } = n2
    const textNode = n2.el = document.createTextNode(children)
    container.append(textNode)
  }

  // 处理元素分支
  function processElement(n1, n2, container, parentComponent, anchor) {
    // 如果没有老的vnode 可以直接进行元素挂载
    if(!n1) {
      mountElement(n2, container, parentComponent, anchor)
    } else {
      patchElement(n1, n2, container, parentComponent, anchor)
    }
  }

  function mountElement(vnode, container, parentComponent, anchor) {
    // 创建当前分支节点
    // const el = vnode.el = document.createElement(vnode.type)
    const el = vnode.el = hostCreateElement(vnode.type)
    const { children, shapeFlag, props } = vnode

    // 通过位运算的 & 查询children 是否是 TEXT_CHILDREN 类型
    if (shapeFlag & ShapeFlags.TEXT_CHILDREN) {
      el.textContent = children
      // 通过位运算的 & 查询children 是否是 ARRAY_CHILDREN 类型
    } else if (shapeFlag & ShapeFlags.ARRAY_CHILDREN) {
      // todo 这一块是改变 container的时机
      mountChildren(vnode.children, el, parentComponent, anchor)
    }

    // 设置元素的属性
    for(const key in props) {
      const value = props[key]
      hostPatchProp(el, key, null, value)
    }
    // 真正将元素挂载到dom树上的操作, 也是最终的操作
    // 将当前分支节点挂载在父级节点上
    hostInsert(el, container, anchor)
  }

  function patchElement(n1, n2, container, parentComponent, anchor) {
    console.log('patchElement')
    console.log('n1', n1)
    console.log('n2', n2)
    // 对比props
    const oldProps = n1.props || EMPTY_OBJ
    const newProps = n2.props || EMPTY_OBJ
    const el = n2.el = n1.el

    patchChildren(n1, n2, el, parentComponent, anchor)
    patchProps(el, oldProps, newProps)
  }

  /**
   * 对比新旧虚拟node的children
   * @param el 当前节点的el
   * @param n1 老的vnode
   * @param n2 新的vnode
   * @param container 当前节点el的父级
   * @param parentComponent 父级组件
   * @param anchor 锚点
   */
  function patchChildren(n1, n2, container, parentComponent, anchor) {
    const prevShapeFlag = n1.shapeFlag
    const nextShapeFlag = n2.shapeFlag

    const c1 = n1.children
    const c2 = n2.children
    // 1. 老的是 text 新的是 text
    // 2. 老的是 text 新的是 array
    // 3. 老的是 array 新的是 text
    // 4. 老的是 array 新的是 array
    if(nextShapeFlag & ShapeFlags.TEXT_CHILDREN) { // 新的是text
      if(prevShapeFlag & ShapeFlags.ARRAY_CHILDREN) {  // 新的是text 老的是array
        unmountChildren(c1)
      }
      if(prevShapeFlag & ShapeFlags.TEXT_CHILDREN) {  // 新的是text 老的是text
        hostSetElementText(container, c2)
      }
    } else { // 新的array
      if(prevShapeFlag & ShapeFlags.TEXT_CHILDREN) { // 新的是array 老的是text
        hostSetElementText(container, '')
        mountChildren(c2, container, parentComponent, anchor)
      } else {  // 新的是array 老的是array
        patchKeyedChildren(c1, c2, container, parentComponent, anchor)
      }
    }

  }

  function patchKeyedChildren(c1, c2, container, parentComponent, parentAnchor) {
    let l1 = c1.length
    let l2 = c2.length
    let i = 0 // 指针1: 针对nodeList的前端 从索引为0开始
    let e1 = l1 - 1 // 指针2: c1 的nodeList的后端 从索引为c1的最后一位开始
    let e2 = l2 - 1 // 指针3: c2 的nodeList的后端 从索引为c2的最后一位开始

    function isSameVNodeType(n1, n2) {
      return n1.type === n2.type && n1.key === n2.key;
    }

    // 从前端开始比对, 一直到比对到不同的节点为止, 相同时指针1向后走一步
    while(i <= e1 && i <= e2) {
      const n1 = c1[i]
      const n2 = c2[i]
      if (isSameVNodeType(n1, n2)) {
        patch(n1, n2, container, parentComponent, parentAnchor)
      } else {
        break;
      }
      i++
    }

    // 从后端开始比对, 一直到比对到不同的节点为止, 相同时e1, e2 各往前走一步
    // while(e1 >= i && e2 >= i) {
    while(i <= e1 && i <= e2) {
      const n1 = c1[e1]
      const n2 = c2[e2]
      if (isSameVNodeType(n1, n2)) {
        patch(n1, n2, container, parentComponent, parentAnchor)
      } else {
        break;
      }
      e1--
      e2--
    }
    if (i > e1) {
      // 前面或者后面都一样 且新的更长的情况
      if(i <= e2) {
        // anchor
        const nextPos = e2 + 1
        const anchor = nextPos < l2 ? c2[nextPos].el : null
        // 默认添加是添加在树的最后, 现在需要找到添加的具体位置(即锚点)
        while(i <= e2) {
          // 参数n1为null时后续触发insert的操作
          patch(null, c2[i], container, parentComponent, anchor)
          i++
        }
      }
    } else if(i > e2) {
      if(i <= e1) {
        while(i <= e1) {
          hostRemove(c1[i].el)
          i++
        }
      }
    } else {
      let s1 = i
      let s2 = i
      // 对比中间的
      const keyToNewIndexMap = new Map()
      for (let k = s1; k <= e2; k++) {
        const nextChild = c2[k]
        keyToNewIndexMap.set(nextChild.key, k)
      }

      for (let k = s1; k <= e1; k++) {
        const prevChild = c1[k]

        let newIndex
        if(prevChild.key != null) {
          newIndex = keyToNewIndexMap.get(prevChild.key)
        } else {
          for(let j = e2; j <= e2; j++) {
            const nextChild = c2[j]
            if(isSameVNodeType(prevChild, nextChild)){
              newIndex = j
              break
            }
          }
        }
        // newIndex 等于 undefined 则表示在老的节点不存在新的里面
        if(newIndex === undefined) {
          hostRemove(prevChild.el)
        } else {
          // 老的在新的里面存在
        }
      }
    }
  }

  // 删除所有的子节点
  function unmountChildren(children) {
    for (let i = 0; i < children.length; i++) {
      // el 为当前节点
      const el = children[i].el
      hostRemove(el)
    }
  }

  function patchProps(el, oldProps, newProps) {
    // 直接遍历新的props对象
    for(const key in newProps) {
      const prevProp = oldProps[key]
      const nextProp = newProps[key]
      // 前后不相等时 (修改)
      if (prevProp !== nextProp) {
        hostPatchProp(el, key, prevProp, nextProp)
      }
    }
    if(oldProps !== EMPTY_OBJ) {
      for(const key in oldProps) {
        if(!(key in newProps)) {
          hostPatchProp(el, key, null, null)
        }
      }
    }
  }

  // 递归处理子集
  function mountChildren(children, container, parentComponent, anchor) {
    children.forEach((v) => {
      patch(null, v, container, parentComponent, anchor)
    })
  }

  function processComponent(n1, n2, container, parentComponent, anchor) {
    mountComponent(n2, container, parentComponent, anchor)
  }

  // 挂载组件流程
  function mountComponent(initialVnode, container, parentComponent, anchor) {
    // 返回一个组件实例
    const instance = createComponentInstance(initialVnode, parentComponent)
    // 处理组件的setup逻辑
    setupComponent(instance) // 执行完以后会初始化instance setup 并且再instance上添加render方法
    // 将组件的render和组件的setup进行关联
    setupRenderEffect(instance, initialVnode, container, anchor)
  }

  // 将setup的值和render函数关联起来
  function setupRenderEffect(instance, initialVnode, container, anchor) {
    // 次数需要分清楚是初始化还是更新流程
    effect(() => {
      if (!instance.isMounted) {
        console.log('初始化')
        const { proxy } = instance
        // 将subtree存储在实例上
        const subTree = instance.subTree = instance.render.call(proxy)
        patch(null, subTree, container, instance, anchor)
        initialVnode.el = subTree.el
        instance.isMounted = true
      } else {
        console.log('更新')
        const { proxy } = instance
        // 将subtree存储在实例上
        const subTree = instance.render.call(proxy)
        const prevTree = instance.subTree
        instance.subTree = subTree
        patch(prevTree, subTree, container, instance, anchor)
        // initialVnode.el = subTree.el
      }
    })
  }

  return {
    createApp: createAppAPI(render)
  }
}

