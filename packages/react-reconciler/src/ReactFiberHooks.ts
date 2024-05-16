import { scheduleUpdateOnFiber } from "./ReactFiberWorkLoop";
import type { Fiber, FiberRoot } from "./ReactInternalTypes";
import { HostRoot } from "./ReactWorkTags";

type Hook = {
	memoizedState: any;
	next: null | Hook;
};

// 当前正在工作的函数组件的fiber
let currentlyRenderingFiber: Fiber | null = null;
// 当前正在工作的hook
let workInProgressHook: Hook | null = null;
let currentHook: Hook | null = null;


export function renderWithHooks<Props>(
	current: null | Fiber,
	workInProgress: Fiber,
	Component: any,
	props: Props
): any {
	currentlyRenderingFiber = workInProgress;
	workInProgress.memoizedState = null;
	let children = Component(props);
	finishRenderingHooks();
	return children;
}

function finishRenderingHooks() {
	currentlyRenderingFiber = null;
	currentHook = null;
	workInProgressHook = null;
}

// 1. 返回当前useX函数对应的hook
// 2. 构建hook链表
function updateWorkInProgressHook(): Hook {
	let hook: Hook;

	const current = currentlyRenderingFiber?.alternate;
	if (current) {
		// update阶段
        currentlyRenderingFiber!.memoizedState = current.memoizedState;
        if(workInProgressHook) {
            hook = workInProgressHook = workInProgressHook.next!;
            currentHook = currentHook?.next as Hook;

        } else {
            // hook单链表的头节点
            hook = workInProgressHook = currentlyRenderingFiber?.memoizedState;
            currentHook = current.memoizedState;
        }
	} else {
		// mount阶段
        currentHook = null;
        hook = {
            memoizedState: null,
            next: null,
        }
        if(workInProgressHook) {
            workInProgressHook = workInProgressHook.next = hook;
        } else {
            // hook单链表的头节点
            workInProgressHook = currentlyRenderingFiber!.memoizedState = hook;
        }
	}


	return hook;
}

export function useReducer<S, I, A>(
	reducer: (state: S, action: A) => S,
	initialArg: I,
	init?: (initialArg: I) => S
) {
	// ! 1. 构建hooks链表(mount, update)
	const hook: Hook = updateWorkInProgressHook();

	let initialState: S;
	if (init !== undefined) {
		initialState = init(initialArg);
	} else {
		initialState = initialArg as any;
	}

	// ! 2. 区分函数组件是初次挂载还是更新
    if(!currentlyRenderingFiber?.alternate) {
        // mount
        hook.memoizedState = initialState;
    } 	

	// ! 3. dispatch
	const dispatch = dispatchReducerAction.bind(null, currentlyRenderingFiber as Fiber, hook, reducer as any )
	return [hook.memoizedState, dispatch];
}

function dispatchReducerAction<S, I, A>(fiber: Fiber, hook: Hook, reducer: (state: S, action: A) => S, action: A) {
	hook.memoizedState = reducer ? reducer(hook.memoizedState, action) : action;
    fiber.alternate = {...fiber};
    const root = getRootForUpdateFiber(fiber);
    // 调度更新
    scheduleUpdateOnFiber(root, fiber);
}

function getRootForUpdateFiber(sourceFiber: Fiber): FiberRoot {
    let node = sourceFiber;
    let parent = node.return;

    while(parent !== null) {
        node = parent;
        parent = node.return;
    }

    return node.tag === HostRoot ? node.stateNode : null;
}