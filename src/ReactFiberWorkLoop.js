import { createWorkInProgress } from './ReactFiber';
import { beginWork } from './ReactFiberBeginWork';
import { commitPlacement, commitWork, commitDeletion } from './ReactFiberCommitWork';
import { completeWork } from './ReactFiberCompleteWork';
import { Deletion, Placement, PlacementAndUpdate, Update } from './ReactFiberFlags';

let workInProgressRoot = null;
let workInProgress = null;

/**
 * 不管如何更新，不管谁来更新，都会调度到这个方法里
 * @param {*} fiber
 */
export function scheduleUpdateOnFiber(fiber) {
  // 遍历更新子节点的过期时间，返回fiberRoot
  const fiberRoot = markUpdateLaneFromFiberToRoot(fiber);
  performSyncWorkOnRoot(fiberRoot);
}

function performSyncWorkOnRoot(fiberRoot) {
  workInProgressRoot = fiberRoot;
  workInProgress = createWorkInProgress(workInProgressRoot.current);
  workLoopSync(); // 执行工作循环，构建副作用链
  commitRoot(); // 提交，修改dom
}

function commitRoot() {
  // 指向新构建的fiber树
  const finiShedWork = workInProgressRoot.current.alternate;
  workInProgressRoot.finiShedWork = finiShedWork;
  commitMutaionEffects(workInProgressRoot);
}

function getFlags(flags) {
  switch (flags) {
    case Placement:
      return '插入';
    case Update:
      return '更新';
    case Deletion:
      return '删除';
    case PlacementAndUpdate:
      return '移动';
    default:
      break;
  }
}

function commitMutaionEffects(root) {
  const finiShedWork = root.finiShedWork;
  let nextEffect = finiShedWork.firstEffect;
  let effectList = '';
  while (nextEffect) {
    effectList += `(${getFlags(nextEffect.flags)}#${nextEffect.type}#${nextEffect.key})=>`;
    const flags = nextEffect.flags;
    let current = nextEffect.alternate;
    if (flags === Placement) {
      commitPlacement(nextEffect);
    } else if (flags === PlacementAndUpdate) {
      commitPlacement(nextEffect);
      nextEffect.flags = Update;
      commitWork(current, nextEffect);
    } else if (flags === Update) {
      commitWork(current, nextEffect);
    } else if (flags === Deletion) {
      commitDeletion(nextEffect);
    }
    nextEffect = nextEffect.nextEffect;
  }
  effectList += 'null';
  console.log(effectList);
  root.current = finiShedWork;
}

// 开始自上而下构建新的fiber树
function workLoopSync() {
  while (workInProgress) {
    performUnitOfWork(workInProgress);
  }
}

/**
 * 执行单个工作单元
 * unitOfWork 要处理的fiber
 */
function performUnitOfWork(unitOfWork) {
  // 获取当前正在构建的fiber替身
  const current = unitOfWork.alternate;
  // 开始构建当前fiber的子fiber链表
  // 他会返回下一个要处理的fiber 一般都是unitOfWork的大儿子
  let next = beginWork(current, unitOfWork);
  // 在beginWork后需要将新属性同步到老属性上
  unitOfWork.memoizedProps = unitOfWork.pendingProps;
  // 当前的fiber还有子节点
  if (next) {
    workInProgress = next;
  } else {
    // 如果当前的 fiber没有子节点，当前的fiber就算完成
    completeUnitOfWork(unitOfWork);
  }
}

function completeUnitOfWork(unitOfWork) {
  let completedWork = unitOfWork;
  do {
    const current = completedWork.alternate;
    const returnFiber = completedWork.return;
    // 完成此fiber对应的真实dom创建和属性赋值功能
    completeWork(current, completedWork);
    // 收集当前fiber副作用到父fiber上
    collectEffectList(returnFiber, completedWork);
    // 当自己这个fiber完成后，如何寻找下一个要构建的fiber
    const siblingFiber = completedWork.sibling;
    if (siblingFiber) {
      // 如果有弟弟，就开始构建弟弟，beginWork
      workInProgress = siblingFiber;
      return;
    }
    // 如果没有弟弟，说明这是最后一个儿子，父亲也完成了
    // 这个循环到最后的时候returnFiber就是null，也就是根fiber的父亲
    completedWork = returnFiber;
    // workInProgress为null就可以退出循环
    workInProgress = completedWork;
  } while (workInProgress);
}

function collectEffectList(returnFiber, completedWork) {
  if (returnFiber) {
    // 如果父亲没有effectList，那就让父亲的firstEffect链表头指向自己的头
    if (!returnFiber.firstEffect) {
      returnFiber.firstEffect = completedWork.firstEffect;
    }
    // 如果自己链表有尾
    if (completedWork.lastEffect) {
      // 并且父链表也有尾
      if (returnFiber.lastEffect) {
        // 把自己身上的effectList挂接到父亲的链表尾部
        returnFiber.lastEffect.nextEffect = completedWork.lastEffect;
      }
      returnFiber.lastEffect = completedWork.lastEffect;
    }
    const flags = completedWork.flags;
    // 如果此完成的fiber有副作用，那么就需要添加到effectList里
    if (flags) {
      // 如果父链表已经有lastEffect的话说明父fiber已经有effect链表
      if (returnFiber.lastEffect) {
        returnFiber.lastEffect.nextEffect = completedWork;
      } else {
        returnFiber.firstEffect = completedWork;
      }
      returnFiber.lastEffect = completedWork;
    }
  }
}

function markUpdateLaneFromFiberToRoot(sourceFiber) {
  let node = sourceFiber;
  let parent = node.return;
  while (parent) {
    node = parent;
    parent = parent.return;
  }
  // node是fiber树的根节点，其实就是hostRootFiber.stateNode div#root
  return node.stateNode;
}
