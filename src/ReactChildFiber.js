import { REACT_ELEMENT_TYPE } from './ReactSymbols';
import { createFiberFromElement, createWorkInProgress } from './ReactFiber';
import { Deletion, Placement } from './ReactFiberFlags';

function childReconciler(shouldTrackSideEffect) {
  function deleteChild(returnFiber, childToDelete) {
    // 如果不需要跟踪副作用，直接返回
    if (!shouldTrackSideEffect) {
      return;
    }
    // 把自己这个副作用添加到父effectList中
    // 删除的副作用，一般放在父fiber副作用链表的前面，在执行DOM操作前先执行删除操作
    const lastEffect = returnFiber.lastEffect;
    if (lastEffect) {
      lastEffect.nextEffect = childToDelete;
      returnFiber.lastEffect = childToDelete;
    } else {
      // 父fiber节点effectList为空
      returnFiber.firstEffect = returnFiber.lastEffect = childToDelete;
    }
    // 清空下一个副作用指向
    childToDelete.nextEffect = null;
    // 标记为删除
    childToDelete.flags = Deletion;
  }

  function deleteRemainingChildren(returnFiber, childToDelete) {
    while (childToDelete) {
      deleteChild(returnFiber, childToDelete);
      childToDelete = childToDelete.sibling;
    }
  }

  function _useFiber(oldFiber, pendingProps) {
    let clone = createWorkInProgress(oldFiber, pendingProps);
    clone.index = 0; // 此fiber挂载得索引清空
    clone.sibling = null; // 把弟弟清空
    return clone;
  }
  /**
   * 协调单节点
   * @param {*} returnFiber 新的父fiber
   * @param {*} currentFirstChild 第一个旧fiber
   * @param {*} element 新的要渲染的虚拟dom是一个单节点
   * @returns
   */
  function reconcileSingleElement(returnFiber, currentFirstChild, element) {
    // 获取新的虚拟DOM的key
    let key = element.key;
    // 获取第一个老的fiber节点
    let child = currentFirstChild;
    while (child) {
      // 老fiber的key和新fiber的key相同
      if (child.key === key) {
        // 判断老的fiber的type和新的虚拟DOM的type是否相同
        if (child.type === element.type) {
          // 准备复用child老fiber节点，删除剩下的其它fiber
          deleteRemainingChildren(returnFiber, child.sibling);
          // 在复用老fiber的时候，会传递新的虚拟DOM属性对象到新fiber的pendingProps
          const existing = _useFiber(child, element.props);
          existing.return = returnFiber;
          return existing;
        } else {
          // 已经匹配上key了，但是type不同，则删除当前老fiber在内的所有老fiber
          deleteRemainingChildren(returnFiber, child);
          break;
        }
      } else {
        // 如果不相同说明当前这个老fiber不是对应新的虚拟DOM节点
        // 把此老fiber标记为删除，并继续弟弟
        deleteChild(returnFiber, child);
      }
      child = child.sibling;
    }
    const created = createFiberFromElement(element);
    created.return = returnFiber;
    return created;
  }

  function placeSingleChild(newFiber) {
    // 如果当前需要跟踪父作用，并且当前这个新fiber它的替身不存在
    if (shouldTrackSideEffect && !newFiber.alternate) {
      // 给这个新fiber添加一个副作用，表示在未来提前阶段的DOM操作中会像真实DOM树中添加此节点
      newFiber.flags = Placement;
    }
    return newFiber;
  }

  function createChild(returnFiber, newChildr) {
    const created = createFiberFromElement(newChildr);
    created.return = returnFiber;
    return created;
  }

  function updateElement(returnFiber, oldFiber, newChild) {
    if (oldFiber) {
      if (oldFiber.type === newChild.type) {
        const existing = _useFiber(oldFiber, newChild.props);
        existing.return = returnFiber;
        return existing;
      }
    }
    // 如果没有老fiber
    const created = createFiberFromElement(newChild);
    created.return = returnFiber;
    return created;
  }

  function updateSlot(returnFiber, oldFiber, newChild) {
    const key = oldFiber ? oldFiber.key : null;
    // 如果新的虚拟DOM的key和老fiber的key一样
    if (newChild.key === key) {
      return updateElement(returnFiber, oldFiber, newChild);
    } else {
      // 不一样直接返回null
      return null;
    }
  }

  function palceChild(newFiber, lastPlacedIndex, newIndex) {
    newFiber.index = newIndex;
    if (!shouldTrackSideEffect) {
      return lastPlacedIndex;
    }
    const current = newFiber.alternate;
    if (current) {
      const oldIndex = current.index;
      // 如果老fiber对应的真实DOM挂载的索引比lastPlacedIndex小;
      if (oldIndex < lastPlacedIndex) {
        // 老fiber对应的真实DOM就需要移动
        newFiber.flags |= Placement;
        return lastPlacedIndex;
      } else {
        // 否则不需要移动，并把老fiber它原来挂载的索引返回成为新的lastPlacedIndex
        return oldIndex;
      }
    } else {
      newFiber.flags = Placement;
      return lastPlacedIndex;
    }
  }

  function updateFromMap(existingChildren, returnFiber, newIndex, newChild) {
    const matchedFiber = existingChildren.get(newChild.key || newIndex);
    return updateElement(returnFiber, matchedFiber, newChild);
  }

  /**
   * 如果新的虚拟DOM是一个数组的话，也就是有多个儿子
   * @param {*} returnFiber
   * @param {*} currentFirstChild
   * @param {*} newChild
   */
  function reconcileChildrenArray(returnFiber, currentFirstChild, newChildren) {
    // 将要返回的第一个新fiber
    let resultingFirstChild = null;
    // 上一个新fiber
    let previousNewFiber = null;
    // 当前老fiber
    let oldFiber = currentFirstChild;
    // 下一个老fiber
    let nextOldFiber = null;
    // 指的是上一个可以复用的不用移动的，不需要移动的节点的老索引
    let lastPlacedIndex = 0;
    // 新的虚拟DOM的索引
    let newIndex = 0;
    // 处理更新的情况，老fiber和新fiber都存在
    for (; oldFiber && newIndex < newChildren.length; newIndex++) {
      // 先缓存一个老fiber
      nextOldFiber = oldFiber.sibling;
      // 试图复用老fiber
      const newFiber = updateSlot(returnFiber, oldFiber, newChildren[newIndex]);
      // 如果key不一样，直接跳出第一轮循环
      if (!newFiber) {
        break;
      }
      // 老fiber存在，但是新的fiber没有复用老fiber
      if (oldFiber && !newFiber.alternate) {
        deleteChild(returnFiber, oldFiber);
      }
      // 核心是给当前的newFiber添加一个副作用flags
      lastPlacedIndex = palceChild(newFiber, lastPlacedIndex, newIndex);
      if (!previousNewFiber) {
        resultingFirstChild = newFiber;
      } else {
        previousNewFiber.sibling = newFiber;
      }
      previousNewFiber = newFiber;
      oldFiber = nextOldFiber;
    }
    if (newIndex === newChildren.length) {
      deleteRemainingChildren(returnFiber, oldFiber);
      return resultingFirstChild;
    }
    // 如果没有老fiber
    if (!oldFiber) {
      // 循环虚拟DOM数组，为每一个虚拟DOM创建一个新的fiber
      for (; newIndex < newChildren.length; newIndex++) {
        const newFiber = createChild(returnFiber, newChildren[newIndex]);
        lastPlacedIndex = palceChild(newFiber, lastPlacedIndex, newIndex);
        if (!previousNewFiber) {
          resultingFirstChild = newFiber;
        } else {
          previousNewFiber.sibling = newFiber;
        }
        previousNewFiber = newFiber;
      }
      return resultingFirstChild;
    }
    // 将剩下的老fiber放入map中
    const existingChildren = mapRemainingChildren(returnFiber, oldFiber);
    for (; newIndex < newChildren.length; newIndex++) {
      // 从map中查找有没有key相同并且类型相同的可以复用的老fiber，老DOM
      const newFiber = updateFromMap(existingChildren, returnFiber, newIndex, newChildren[newIndex]);
      if (newFiber) {
        // 说明是复用的老fiber
        if (newFiber.alternate) {
          existingChildren.delete(newFiber.key || newIndex);
        }
        lastPlacedIndex = palceChild(newFiber, lastPlacedIndex, newIndex);
        if (!previousNewFiber) {
          resultingFirstChild = newFiber;
        } else {
          previousNewFiber.sibling = newFiber;
        }
        previousNewFiber = newFiber;
      }
    }
    // 剩下的是没有被复用的，全部删除
    existingChildren.forEach((child) => deleteChild(returnFiber, child));
    return resultingFirstChild;
  }

  function mapRemainingChildren(returnFiber, currentFirstChild) {
    const existingChildren = new Map();
    let existingChild = currentFirstChild;
    while (existingChild) {
      let key = existingChild.key || existingChild.index;
      existingChildren.set(key, existingChild);
      existingChild = existingChild.sibling;
    }
    return existingChildren;
  }

  /**
   *
   * @param {*} returnFiber 新的父fiber
   * @param {*} currentFirstChild 老的第一个fiber
   * @param {*} newChild 新的虚拟DOM
   */
  function reconcileChildFibers(returnFiber, currentFirstChild, newChild) {
    // 判断newChild是不是一个对象，如果是的话说明虚拟DOM只有一个react节点
    const isObject = typeof newChild === 'object' && newChild;
    // 说明新的虚拟DOM是一个单节点
    if (isObject) {
      switch (newChild.$$typeof) {
        case REACT_ELEMENT_TYPE:
          return placeSingleChild(reconcileSingleElement(returnFiber, currentFirstChild, newChild));
      }
    }
    if (Array.isArray(newChild)) {
      return reconcileChildrenArray(returnFiber, currentFirstChild, newChild);
    }
  }
  return reconcileChildFibers;
}

export const reconcileChildFiber = childReconciler(true);
export const mountChildFiber = childReconciler(false);
