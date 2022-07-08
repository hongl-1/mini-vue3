## mini-vue3

基于 [vuejs/core](https://github.com/vuejs/core) 实现，用于深入学习 `Vue3`。

## Tasking

### reactivity

- [x] reactive 的实现
- [x] track 依赖收集
- [x] trigger 触发依赖
- [x] 支持 effect.scheduler
- [x] 支持 effect.stop
- [x] readonly 的实现
- [x] 支持 isReactive
- [x] 支持 isReadonly
- [x] 支持嵌套 reactive
- [x] 支持嵌套 readonly
- [ ] 支持 shallowReadonly
- [ ] 支持 isProxy
- [ ] ref 的实现
- [ ] 支持 isRef
- [ ] 支持 unref
- [ ] 支持 proxyRefs
- [ ] computed 的实现
- [ ] 支持 toRaw

### runtime-core

- [ ] 支持 element 类型
- [ ] 支持 proxy
- [ ] 初始化 props
- [ ] 支持 component emit
- [ ] 可以在 render 函数中获取 setup 返回的对象
- [ ] setup 可获取 props 和 context
- [ ] 支持 $el api
- [ ] 支持最基础的 slots
- [ ] 支持 Fragment
- [ ] 支持 Text 类型节点
- [ ] 支持 getCurrentInstance
- [ ] 支持 provide/inject
- [ ] 支持组件类型
- [ ] nextTick 的实现

### runtime-dom

- [ ] 支持 custom renderer

### compiler-core

- [ ] 解析插值
- [ ] 解析 element
- [ ] 解析 text
