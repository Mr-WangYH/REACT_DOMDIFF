/**
 * 初始化更新队列
 * 所有的fiber都会将等待更新内容放在更新队列中
 */
export function initializeUpdateQueue(fiber) {
  const updateQueue = {
    shared: {
      pending: null,
    },
  };
  fiber.updateQueue = updateQueue;
}

export function createUpdate() {
  return {};
}

/**
 * 向当前的fiber的更新队列添加一个更新
 * @param {*} fiber
 * @param {*} update
 */
export function enqueueUpdate(fiber, update) {
  let UpdateQueue = fiber.updateQueue;
  const sharedQueue = UpdateQueue.shared;
  const pending = sharedQueue.pending;
  if (!pending) {
    update.next = update;
  } else {
    update.next = pending.next;
    pending.next = update;
  }
  sharedQueue.pending = update;
}
