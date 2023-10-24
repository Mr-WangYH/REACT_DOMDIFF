import { HostComponent } from './ReactWorkTags';
import { appendChild, createInstance, finalizeInitialChildren, prepareUpdate } from './ReactDOMHostConfig';
import { Update } from './ReactFiberFlags';

export function completeWork(current, workInProgress) {
  const newProps = workInProgress.pendingProps;
  switch (workInProgress.tag) {
    case HostComponent:
      // 在新的fiber构建完成的时候，收集更新并且标识 更新副作用
      if (current && workInProgress.stateNode) {
        updateHostComponet(current, workInProgress, workInProgress.tag, newProps);
      } else {
        const type = workInProgress.type;
        // 创建此fiber的真实DOM
        const instance = createInstance(type, newProps);
        appendAllChildren(instance, workInProgress);
        // 让此fiber的真实DOM属性指向instance;
        workInProgress.stateNode = instance;
        // 给真实DOM添加属性,包括独生子是字符串或者数字的情况
        finalizeInitialChildren(instance, type, newProps);
      }
      break;
    default:
      break;
  }
}

function appendAllChildren(parent, workInProgress) {
  let node = workInProgress.child;
  while (node) {
    if (node.tag === HostComponent) {
      // 把大儿子的真实DOM节点添加到父真实DOM节点上
      appendChild(parent, node.stateNode);
    }
    node = node.sibling;
  }
}

/**
 *
 * @param {*} current 老fiber
 * @param {*} workInProgress  新fiber
 * @param {*} tag
 * @param {*} newProps 新的虚拟DOM的新属性
 */
function updateHostComponet(current, workInProgress, tag, newProps) {
  // 老fiber上的老属性
  let oldProps = current.memoizedProps;
  // 可复用真实的DOM节点
  const instance = workInProgress.stateNode;
  const updatePayload = prepareUpdate(instance, tag, oldProps, newProps);
  workInProgress.updateQueue = updatePayload;
  if (updatePayload) {
    // 或等于，以二进制进行计算，相同位上，只要有一个为1就是1
    workInProgress.flags |= Update;
  }
}
/**
 * 根fiber的updateQueue上面是一个环状链表 update {payload: element}
 * 原生组件fiber updateQueue = updatePayload 数组[key1,value1]
 */
