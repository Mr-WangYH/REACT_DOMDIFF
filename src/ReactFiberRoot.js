import { creatHostRootFiber } from './ReactFiber';
import { initializeUpdateQueue } from './ReactUpdateQueue';

export function creatFiberRoot(containerInfo) {
  const fiberRoot = { containerInfo }; // fiberRoot指的就是容器对象containerInfo div#root
  // 创建fiber树根节点
  const hostRootFiber = creatHostRootFiber();
  // 当前的fiberRoot的current指向根fiber
  fiberRoot.current = hostRootFiber;
  // 让此根fiber的真实DOM节点指向fiberRoot div#root  stateNode就是指的真实DOM的意思
  hostRootFiber.stateNode = fiberRoot;
  // 初始化更新队列
  initializeUpdateQueue(hostRootFiber);
  return fiberRoot;
}
