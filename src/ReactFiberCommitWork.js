import { appendChild, removeChild, insertBefore } from './ReactDOMHostConfig';
import { HostComponent, HostRoot } from './ReactWorkTags';
import { updateProperties } from './ReactDOMComponent';
import { Placement } from './ReactFiberFlags';

export function getParentStateNode(fiber) {
  let parent = fiber.return;
  do {
    if (parent.tag === HostComponent) {
      return parent.stateNode;
    } else if (parent.tag === HostRoot) {
      return parent.stateNode.containerInfo;
    } else {
      parent = parent.return;
    }
  } while (parent);
}

/**
 * 插入节点
 * @param {*} nextEffect
 */
export function commitPlacement(nextEffect) {
  let stateNode = nextEffect.stateNode;
  let parentStateNode = getParentStateNode(nextEffect);
  let before = getHostSibling(nextEffect);
  if (before) {
    insertBefore(parentStateNode, stateNode, before);
  } else {
    appendChild(parentStateNode, stateNode);
  }
}

// 当前fiber后面一个离他最近的真实DOM节点
function getHostSibling(fiber) {
  let node = fiber.sibling;
  while (node) {
    // 找到最近的一个不是插入的弟弟
    if (!(fiber.flags & Placement)) {
      return node.stateNode;
    }
    node = node.sibling;
  }
  return null;
}

/**
 * 提交DOM更细操作
 * @param {*} current
 * @param {*} finishedWork
 */
export function commitWork(current, finishedWork) {
  const updatePayload = finishedWork.updateQueue;
  finishedWork.updateQueue = null;
  if (updatePayload) {
    updateProperties(finishedWork.stateNode, updatePayload);
  }
}

export function commitDeletion(fiber) {
  if (!fiber) return;
  let parentStateNode = getParentStateNode(fiber);
  removeChild(parentStateNode, fiber.stateNode);
}
