import { scheduleUpdateOnFiber } from './ReactFiberWorkLoop';
import { createUpdate, enqueueUpdate } from './ReactUpdateQueue';

/**
 * 把虚拟DOM element渲染到真实DOM 插入或者说渲染到container容器中
 * @param {*} element
 * @param {*} container
 */
export function updateContainer(element, container) {
  // 获取hostRootFiber fiber根的根节点
  // 正常来说一个fiber节点会对应一个真实DOM节点，hostRootFiber对应的DOM节点就是containerInfo div#root
  const current = container.current;
  const update = createUpdate();
  update.payload = { element };
  // 把更新添加到fiber的更新队列里
  enqueueUpdate(current, update);
  scheduleUpdateOnFiber(current);
}
