## useState 源码详解 （react 18）

在我们写 react 代码的时候，useState 差不多是我们每天用得最多的一个hooks，虽然用得很多，但可能有很多人不知道它的实现原理，今天就让我们一起来探究下 useState 的原理吧。

### 思考
- 调用了Set函数但是state没有变化的情况下为什么函数不会再次被调用
- useState传参为函数时是如何处理的
- Set函数传参使用函数为什么能拿到上一次变更的state

先来个简单代码
```js
const App = () => {
  const [num, setNum] = useState(1);

  const handleClick = () => {
    setNum(num + 1);
    setNum((n) => {
      return n + 3;
    });
  };

  return (
    <>
      <div key='title' id='title'>
        {num}
      </div>
      <button onClick={handleClick}>点击</button>
    </>
  );
};
export default App;
```

之前我们大概了解了react render 的整体过程，我们知道在对 Fiber 进行构造的时候，是通过在 beginwork 的阶段通过 Swtich Case 然后识别 Fiber 的 tag 再进入不同的流程中。

通过断点，在构建 App 节点时，可以看到在 beginwork 的时候判断其 tag 为IndeterminateComponent（尚未确定具体类型的组件）。 然后调用了 mountIndeterminateComponent 方法，在这个方法里面又调用了 renderWithHooks 方法。

### renderWithHooks
```js
export function renderWithHooks<Props, SecondArg>(
  current: Fiber | null,   // 当前页面使用的Fiber结构
  workInProgress: Fiber,   // 当前正在构造的Fiber结构
  Component: (p: Props, arg: SecondArg) => any,  // 当前处理的组件
  props: Props,   // 传递给组件的值
  secondArg: SecondArg,
  nextRenderLanes: Lanes,   // 下一次render的优先级
): any {
  renderLanes = nextRenderLanes;
  // 设置当前进行render的Fiber节点。 这个在后面会使用
  currentlyRenderingFiber = workInProgress;
  // 进行初始化
  workInProgress.memoizedState = null;
  workInProgress.updateQueue = null;
  workInProgress.lanes = NoLanes;

  // 如果是初次渲染的时候除了hostRootFiber之外其他节点的current都为空
  // 故通过current判断是初次渲染还是更新
  // 然后挂载不同的Dispatcher
  ReactCurrentDispatcher.current =
      current === null || current.memoizedState === null
        ? HooksDispatcherOnMount
        : HooksDispatcherOnUpdate;

  // 这里去调用组件--------也就走入了我们的函数本身
  let children = Component(props, secondArg);

  .....

}
```
### HooksDispatcherOnMount/HooksDispatcherOnUpdate

这两者都是对象。对象中的key都以hook的名称进行命名， value的话对于HooksDispatcherOnMount而言基本都是mountxxxx, 以mount开头。 对于HooksDispatcherOnUpdate而言就是基本都是updatexxxx, 以update开头。 两者分别对应的都是一些函数逻辑。

```js
const HooksDispatcherOnMount: Dispatcher = {
  readContext,

  useCallback: mountCallback,
  useContext: readContext,
  useEffect: mountEffect,
  useImperativeHandle: mountImperativeHandle,
  useLayoutEffect: mountLayoutEffect,
  useInsertionEffect: mountInsertionEffect,
  useMemo: mountMemo,
  useReducer: mountReducer,
  useRef: mountRef,
  useState: mountState,
  useDebugValue: mountDebugValue,
  useDeferredValue: mountDeferredValue,
  useTransition: mountTransition,
  useMutableSource: mountMutableSource,
  useSyncExternalStore: mountSyncExternalStore,
  useId: mountId,

  unstable_isNewReconciler: enableNewReconciler,
};

const HooksDispatcherOnUpdate: Dispatcher = {
  readContext,

  useCallback: updateCallback,
  useContext: readContext,
  useEffect: updateEffect,
  useImperativeHandle: updateImperativeHandle,
  useInsertionEffect: updateInsertionEffect,
  useLayoutEffect: updateLayoutEffect,
  useMemo: updateMemo,
  useReducer: updateReducer,
  useRef: updateRef,
  useState: updateState,
  useDebugValue: updateDebugValue,
  useDeferredValue: updateDeferredValue,
  useTransition: updateTransition,
  useMutableSource: updateMutableSource,
  useSyncExternalStore: updateSyncExternalStore,
  useId: updateId,

  unstable_isNewReconciler: enableNewReconciler,
};
```

### mountState

该函数的逻辑就是生成当前Fiber对应的hook对象, 对其进行各种初始化， 然后再挂载到当前Fiber的memoizedState。返回一个数组，数组的首项为当前维护的 state 的值。 数组的第二项为可以修改 state 的函数。

```js
function mountState<S>(
  initialState: (() => S) | S,
): [S, Dispatch<BasicStateAction<S>>] {
  // 生成当前的hook对象
  const hook = mountWorkInProgressHook();
  // initalState是可以传入一个函数的。此时我们记录的值是该函数的返回值
  if (typeof initialState === 'function') {
    initialState = initialState();
  }
  // 初始化当前hook的memoizedState和baseState， 都赋值为传入的initialState
  hook.memoizedState = hook.baseState = initialState;
  // 生成一个queue对象
  const queue: UpdateQueue<S, BasicStateAction<S>> = {
    pending: null,
    lanes: NoLanes,
    dispatch: null,
    lastRenderedReducer: basicStateReducer,
    lastRenderedState: (initialState: any),
  };
  // 挂载到hook对象上
  hook.queue = queue;
  // 这里其实就是将 dispatchSetState 赋值给了 queue.dispatch 和dispatch
  // 如果触发state的改变的话就是触发了dispatchSetState
  // 为什么要在这里传入 currentlyRenderingFiber 呢？因为我们可能随时在某一个组件上触发更新，如果不在这里进行绑定，我们是无法确定是 Fiber 树上的哪个节点触发了更新操作，我们就无法给对应节点追加更新任务。
  const dispatch: Dispatch<
    BasicStateAction<S>,
  > = (queue.dispatch = (dispatchSetState.bind(
    null,
    currentlyRenderingFiber,
    queue,
  ): any));
  return [hook.memoizedState, dispatch];
}
```

### mountWorkInProgressHook

生成hook对象，然后挂在当前 Fiber 的 memoizedState上。 用workInProgressHook作为指针， 始终指向当前链表的最后一个。

```js
function mountWorkInProgressHook(): Hook {
  const hook: Hook = {
    memoizedState: null,
    baseState: null,
    baseQueue: null,
    queue: null,
    next: null,   // 看到了next就应该知道他是要形成对应的链表
  };
  // 如果当前Fiber的workInProgressHook还没有初始化的时候对其进行初始化
  if (workInProgressHook === null) {
    // 前面我们在renderWithHooks的时候就设置了currentlyRenderingFiber为workInprogress, 也就是当前的Fiber
    // 故这里是当workInProgressHook指向当前生成的hook对象
    // 然后挂到当前Fiber的memoizedState上
    currentlyRenderingFiber.memoizedState = workInProgressHook = hook;
  } else {
    // 如果已经初始化过的话， 那么就直接找到next挂上去。 
    // 且workInProgressHook指向他的next。
    // 让workInProgressHook始终指向链表的最后一个， 从而能够继续挂上其他hook对象
    workInProgressHook = workInProgressHook.next = hook;
  }
  return workInProgressHook;
}
```

### dispatchSetState

```js
function dispatchSetState<S, A>(
  fiber: Fiber,   // 挂载的时候传入， 为当前节点的Fiber
  queue: UpdateQueue<S, A>,   // 当前节点的hook.queue
  action: A,  // 这里的action就是我们传入的东西。 可以为值也可以是函数
) {
  // 获取优先级
  const lane = requestUpdateLane(fiber);
  // 生成了一个update对象
  const update: Update<S, A> = {
    lane,
    action,
    hasEagerState: false,
    eagerState: null,
    next: (null: any),
  };

  // 判断是否处于render更新阶段
  if (isRenderPhaseUpdate(fiber)) {
    // 是的话将update对象加入queue的pending链表上
    enqueueRenderPhaseUpdate(queue, update);
  } else {
    const alternate = fiber.alternate;
    if (
      fiber.lanes === NoLanes &&
      (alternate === null || alternate.lanes === NoLanes)
    ) {
      // 在初始化queue对象的时候， 我们给queue.lastRenderedReducer就赋值了basicStateReducer
      const lastRenderedReducer = queue.lastRenderedReducer;
      if (lastRenderedReducer !== null) {
        let prevDispatcher;
        try {
          // 这里初始化的时候也是赋值了initialState
          const currentState: S = (queue.lastRenderedState: any);
          // 传入当前的state和传入的action， 拿到期望的更新之后的state
          const eagerState = lastRenderedReducer(currentState, action);
          // 表示该update对象的期望state已经计算出来了并赋值
          update.hasEagerState = true;
          update.eagerState = eagerState;
          // 进行浅比较， 如果一致的话将update推入栈之后直接return。 
          if (is(eagerState, currentState)) {
            enqueueConcurrentHookUpdateAndEagerlyBailout(fiber, queue, update);
            return;
          }
        }
      }
    }

    const root = enqueueConcurrentHookUpdate(fiber, queue, update, lane);
    if (root !== null) {
      const eventTime = requestEventTime();
      scheduleUpdateOnFiber(root, fiber, lane, eventTime);
      entangleTransitionUpdate(root, queue, lane);
    }
  }
}
```

### isRenderPhaseUpdate

判断是否处于render阶段，我们前面有涉及到currentlyRenderingFiber是在renderWithHooks的时候进行赋值的。那renderWithHooks其实就是处于render阶段的。在点击触发state的修改时。直接走到了dispatchSetState,没有经过renderWithHooks，故此时拿到的currentlyRenderingFiber就为空。

```js
function isRenderPhaseUpdate(fiber: Fiber) {
  const alternate = fiber.alternate;
  return (
    fiber === currentlyRenderingFiber ||
    (alternate !== null && alternate === currentlyRenderingFiber)
  );
}
```

###  enqueueRenderPhaseUpdate

当state触发变更时刚好处于render阶段时。 会将update对象存放到queue的pending链上，也是以链表的方法存储。 在这个render过程之后， 我们将会重新启动更新
```js
function enqueueRenderPhaseUpdate<S, A>(
  queue: UpdateQueue<S, A>,
  update: Update<S, A>,
) {
  didScheduleRenderPhaseUpdateDuringThisPass = didScheduleRenderPhaseUpdate = true;
  const pending = queue.pending;
  if (pending === null) {
    update.next = update;
  } else {
    update.next = pending.next;
    pending.next = update;
  }
  queue.pending = update;
}
```

### basicStateReducer

对于action而言, 可以传入的参数有两种。 一种是直接传值。 一种是传入函数。 如果是函数的话函数的参数为当前的state。 故该函数就是处理了这两种情况。 这里的state就是目前最新的state， 我们常用函数的方式处理闭包可能带来的问题。

```js
function basicStateReducer<S>(state: S, action: BasicStateAction<S>): S {
  return typeof action === 'function' ? action(state) : action;
}
```

### enqueueConcurrentHookUpdate

这里就是推入栈中保存。这里调用的是enququeUpdate，主要就是将queue和update推入栈，然后更新了Fiber的lanes

```js
function enqueueConcurrentHookUpdate<S, A>(
  fiber: Fiber,
  queue: HookQueue<S, A>,
  update: HookUpdate<S, A>,
  lane: Lane,
): FiberRoot | null {
  const concurrentQueue: ConcurrentQueue = (queue: any);
  const concurrentUpdate: ConcurrentUpdate = (update: any);
  enqueueUpdate(fiber, concurrentQueue, concurrentUpdate, lane);
  return getRootForUpdatedFiber(fiber);
}
```

### finishQueueingConcurrentUpdates

按照入栈的方式，将update对象, queue对象等从栈中取出来，将update对象加入queue的pending链表
所以我们如果有State的变更，就会产生对应的update对象。最后的归宿都是加入的hook.queue.pending链表上。

```js
function finishQueueingConcurrentUpdates(): void {
  const endIndex = concurrentQueuesIndex;
  concurrentQueuesIndex = 0;

  concurrentlyUpdatedLanes = NoLanes;

  let i = 0;  // 下标从0开始
  while (i < endIndex) {
    //  这个过程就是拿到栈中保存的东西
    const fiber: Fiber = concurrentQueues[i];
    concurrentQueues[i++] = null;
    const queue: ConcurrentQueue = concurrentQueues[i];
    concurrentQueues[i++] = null;
    const update: ConcurrentUpdate = concurrentQueues[i];
    concurrentQueues[i++] = null;
    const lane: Lane = concurrentQueues[i];
    concurrentQueues[i++] = null;
    // 这里就是放入链表的操作
    if (queue !== null && update !== null) {
      const pending = queue.pending;
      if (pending === null) {
        // This is the first update. Create a circular list.
        update.next = update;
      } else {
        update.next = pending.next;
        pending.next = update;
      }
      queue.pending = update;
    }
    if (lane !== NoLane) {
      markUpdateLaneFromFiberToRoot(fiber, update, lane);
    }
  }
}
```

### updateState

调用 updateState 后直接就是调用 updateReducer

```js
function updateState<S>(
  initialState: (() => S) | S,
): [S, Dispatch<BasicStateAction<S>>] {
  return updateReducer(basicStateReducer, (initialState: any));
}
```

### updateReducer

```js
function updateReducer<S, I, A>(
  reducer: (S, A) => S,
  initialArg: I,
  init?: I => S,
): [S, Dispatch<A>] {
  // 拿到当前的hook对象
  // 该hook对象可能是根据current树的hook生成的， 也可能是直接复用给的。 
  // 具体可以看下面updateWorkInProgressHook内部实现
  const hook = updateWorkInProgressHook();
  const queue = hook.queue;

  if (queue === null) {
    throw new Error(
      'Should have a queue. This is likely a bug in React. Please file an issue.',
    );
  }

  // 这里的赋值对useState来说都一样
  // 因为本身我们给queue.lastRenderedReducerc初始化就是basicStateReducer
  // 这里传入的reducer也是basicStateReducer
  queue.lastRenderedReducer = reducer;
  // currentHook在updateWorkInProgressHook内对他进行赋值了
  // 拿到的就是current树上的hook链表
  const current: Hook = (currentHook: any);
  let baseQueue = current.baseQueue;
  // queue.pending上存放的就是对应的update对象
  const pendingQueue = queue.pending;
  if (pendingQueue !== null) {
    if (baseQueue !== null) {  // 初始化的时候还是null
      const baseFirst = baseQueue.next;
      const pendingFirst = pendingQueue.next;
      baseQueue.next = pendingFirst;
      pendingQueue.next = baseFirst;
    }
    current.baseQueue = baseQueue = pendingQueue;
    queue.pending = null;
  }

  // 这一部分就是遍历我们的baseQueue， 根据update上的action， 然后拿到的最后的State， 并更新到hook对象上。
  if (baseQueue !== null) {
    const first = baseQueue.next;
    let newState = current.baseState;

    let newBaseState = null;
    let newBaseQueueFirst = null;
    let newBaseQueueLast = null;
    let update = first;  // 指针指向baseQueue.next。 其实就是第一个update
    // 走一遍update链。 把update上的action都执行完毕， 计算出最后的值， 更新的hook中
    do {
      const updateLane = removeLanes(update.lane, OffscreenLane);
      const isHiddenUpdate = updateLane !== update.lane;
      const shouldSkipUpdate = isHiddenUpdate
        ? !isSubsetOfLanes(getWorkInProgressRootRenderLanes(), updateLane)
        : !isSubsetOfLanes(renderLanes, updateLane);
      // 如果优先级不够的话会被打断的
      if (shouldSkipUpdate) {
        const clone: Update<S, A> = {
          lane: updateLane,
          action: update.action,
          hasEagerState: update.hasEagerState,
          eagerState: update.eagerState,
          next: (null: any),
        };
        if (newBaseQueueLast === null) {
          newBaseQueueFirst = newBaseQueueLast = clone;
          newBaseState = newState;
        } else {
          newBaseQueueLast = newBaseQueueLast.next = clone;
        }
        currentlyRenderingFiber.lanes = mergeLanes(
          currentlyRenderingFiber.lanes,
          updateLane,
        );
        markSkippedUpdateLanes(updateLane);
      } else {
        if (newBaseQueueLast !== null) {
          const clone: Update<S, A> = {
            lane: NoLane,
            action: update.action,
            hasEagerState: update.hasEagerState,
            eagerState: update.eagerState,
            next: (null: any),
          };
          newBaseQueueLast = newBaseQueueLast.next = clone;
        }

        // 我们在dispatchSetState的时候处理了hasEagerState，值已经算好了
        if (update.hasEagerState) {
          // 直接赋值
          newState = ((update.eagerState: any): S);
        } else {
          // 还没算的话就从update对象中拿到action。 算出结果进行赋值
          const action = update.action;
          newState = reducer(newState, action);
        }
      }
      update = update.next;
    } while (update !== null && update !== first);

    if (newBaseQueueLast === null) {
      newBaseState = newState;
    } else {
      newBaseQueueLast.next = (newBaseQueueFirst: any);
    }

     // 比较前后的State， 如果一致的话就设置ReceivedUpdate
    if (!is(newState, hook.memoizedState)) {
      markWorkInProgressReceivedUpdate();
    }

    // 处理完之后将新的State挂上hook
    hook.memoizedState = newState;
    // 重置baseState和baseQueue
    hook.baseState = newBaseState;
    hook.baseQueue = newBaseQueueLast;

    queue.lastRenderedState = newState;
  }

  if (baseQueue === null) {
    queue.lanes = NoLanes;
  }

  const dispatch: Dispatch<A> = (queue.dispatch: any);
  return [hook.memoizedState, dispatch];
}
```

### updateWorkInProgressHook

```js
function updateWorkInProgressHook(): Hook {
  let nextCurrentHook: null | Hook;
  // currentHook是全局维护的变量来的， 初始化为null
  // 这个逻辑块处理nextCurrentHook的初始化， 找的是current树
  if (currentHook === null) {
    // 拿到当前的页面使用的Fiber结构
    const current = currentlyRenderingFiber.alternate;
    if (current !== null) {
      // 拿到当前页面使用的Fiber结构的memoizedState。 
      // 上面存放的东西正是我们mountState挂上去的
      nextCurrentHook = current.memoizedState;
    } else {
      nextCurrentHook = null;
    }
  } else {
    nextCurrentHook = currentHook.next;
  }

  // 这个逻辑课处理的是nextWorkInProgressHook的初始化， 找的是workInProgress树
  let nextWorkInProgressHook: null | Hook;
  if (workInProgressHook === null) {
    nextWorkInProgressHook = currentlyRenderingFiber.memoizedState;
  } else {
    nextWorkInProgressHook = workInProgressHook.next;
  }

  // 这里的逻辑块是有可复用的hook， 直接复用即可
  if (nextWorkInProgressHook !== null) {
    workInProgressHook = nextWorkInProgressHook;
    nextWorkInProgressHook = workInProgressHook.next;
    currentHook = nextCurrentHook;
  } else {
    // 这里的逻辑块是没有可复用的， 故根据current树上的hook链表生成自己的hook， 并挂上链表

    // 如果没有nextWorkInProgressHook又没有nextCurrentHook可以直接抛出错误了
    // 因为此时不应该会触发update
    if (nextCurrentHook === null) {
      throw new Error('Rendered more hooks than during the previous render.');
    }

    currentHook = nextCurrentHook;
    // 生成新的hook， 用current hook的值进行初始化
    const newHook: Hook = {
      memoizedState: currentHook.memoizedState,

      baseState: currentHook.baseState,
      baseQueue: currentHook.baseQueue,
      queue: currentHook.queue,

      next: null,
    };

    // workInProgressHook还是跟mountWorkInProgressHook中一样， 始终保持指向最后的节点。
    // 如果为空的话说明还没开启挂到memoizedState， 故需要做初始化
    if (workInProgressHook === null) {
      currentlyRenderingFiber.memoizedState = workInProgressHook = newHook;
    } else {
      // 不为空的话让新的hook继续挂上链表，让workInProgressHook指向他的next即可
      workInProgressHook = workInProgressHook.next = newHook;
    }
  }
  return workInProgressHook;
}
```