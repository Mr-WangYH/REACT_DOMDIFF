import { creatFiberRoot } from './ReactFiberRoot';
import { updateContainer } from './ReactFiberReconciler';

function render(element, container) {
  // 创建一个fiberRoot,其实就是指向我们的div#root这个容器
  let fiberRoot = container._reactRootContainer;
  if (!fiberRoot) {
    fiberRoot = container._reactRootContainer = creatFiberRoot(container);
  }
  // 把element这个虚拟dom变成真实dom插入容器中
  updateContainer(element, fiberRoot);
}
const ReactDOM = {
  render,
};
export default ReactDOM;
