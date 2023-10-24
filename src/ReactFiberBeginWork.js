import { mountChildFiber, reconcileChildFiber } from './ReactChildFiber';
import { HostComponent, HostRoot } from './ReactWorkTags';
import { shouldSetTextContent } from './ReactDOMHostConfig';

export function beginWork(current, workInProgress) {
  switch (workInProgress.tag) {
    case HostRoot:
      return updateHostRoot(current, workInProgress);
    case HostComponent:
      return updateHostComponent(current, workInProgress);
    default:
      break;
  }
}

/**
 * 更新或者挂载根节点
 * 依靠什么构建fiber树？ 虚拟DOM
 * @param {*} current 老fiber
 * @param {*} workInProgress  构建中的新fiber
 */
function updateHostRoot(current, workInProgress) {
  const updateQueue = workInProgress.updateQueue;
  // 获取要显示的虚拟DOM
  const nextChildren = updateQueue.shared.pending.payload.element;
  // 处理子节点，根据老fiber和新的虚拟DOM进行对比，创建新的fiber树
  reconcileChildren(current, workInProgress, nextChildren);
  // 返回第一个子fiber
  return workInProgress.child;
}

function updateHostComponent(current, workInProgress) {
  // 获取此原生组件的类型
  const type = workInProgress.type;
  // 新属性
  const nextProps = workInProgress.pendingProps;
  let nextChildren = nextProps.children;
  // 在react中对于一个原生组件，如果它只有一个儿子，并且这个儿子是字符串的话，不会对此儿子创建一个fiber节点，而是当成一个属性来处理
  let isDirectTextChild = shouldSetTextContent(type, nextProps);
  if (isDirectTextChild) {
    nextChildren = null;
  }
  // 处理子节点，根据老fiber和新的虚拟DOM进行对比，创建新的fiber树
  reconcileChildren(current, workInProgress, nextChildren);
  // 返回第一个子fiber
  return workInProgress.child;
}

function reconcileChildren(current, workInProgress, nextChildren) {
  // current有值，说明就是一个类似于更新的操作
  if (current) {
    // 进行比较 新老内容，得到差异进行更新
    workInProgress.child = reconcileChildFiber(
      workInProgress, //新fiber
      current.child, // 老fiber的第一个子fiber节点
      nextChildren // 新的虚拟DOM
    );
  } else {
    // 初始渲染，不需要比较
    workInProgress.child = mountChildFiber(
      workInProgress, //新fiber
      current && current.child, // 老fiber的第一个子fiber节点
      nextChildren // 新的虚拟DOM
    );
  }
}
