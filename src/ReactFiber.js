import { NoFlags } from './ReactFiberFlags';
import { HostComponent, HostRoot } from './ReactWorkTags';
export function creatHostRootFiber() {
  return creatFiber(HostRoot);
}

/**
 * 创建fiber节点
 * @param {*} tag fiber的标签  HostRoot指的是根节点；  div span是HostComponent
 * @param {*} pendingProps  等待生效的属性对象
 * @param {*} key
 */
function creatFiber(tag, pendingProps, key) {
  return new FiberNode(tag, pendingProps, key);
}

function FiberNode(tag, pendingProps, key) {
  this.tag = tag;
  this.key = key;
  this.pendingProps = pendingProps;
}
/**
 * 根据老fiber创建新fiber
 * @param {*} current
 * @param {*} pendingProps
 * @returns
 */
export function createWorkInProgress(current, pendingProps) {
  let workInProgress = current.alternate;
  if (!workInProgress) {
    workInProgress = creatFiber(current.tag, pendingProps, current.key);
    workInProgress.type = current.type;
    workInProgress.stateNode = current.stateNode;
    workInProgress.alternate = current;
    current.alternate = workInProgress;
  } else {
    workInProgress.pendingProps = pendingProps;
  }
  workInProgress.flags = NoFlags;
  workInProgress.child = null;
  workInProgress.sibling = null;
  workInProgress.updateQueue = current.updateQueue;
  // 在DOM diff的过程中会给fiber添加副作用
  workInProgress.firstEffect = workInProgress.lastEffect = workInProgress.nextEffect = null;
  return workInProgress;
}

/**
 * 根据虚拟DOM元素创建fiber节点
 * @param {*} element
 */
export function createFiberFromElement(element) {
  const { key, type, props } = element;
  let tag;
  if (typeof type === 'string') {
    tag = HostComponent; //标签等于原生组件
  }
  const fiber = creatFiber(tag, props, key);
  fiber.type = type;
  return fiber;
}
