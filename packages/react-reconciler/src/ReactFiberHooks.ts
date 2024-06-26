import { isFn } from "shared/utils";
import { scheduleUpdateOnFiber } from "./ReactFiberWorkLoop";
import type { Fiber, FiberRoot } from "./ReactInternalTypes";
import { HostRoot } from "./ReactWorkTags";
import { type Flags, Update, Passive } from "./ReactFiberFlags";
import { type HookFlags, HookLayout, HookPassive } from "./ReactHookEffectTags";
import { readContext } from "./ReactFiberNewContext";
import { ReactContext } from "shared/ReactTypes";

type Hook = {
	memoizedState: any;
	next: null | Hook;
};

type Effect = {
	tag: HookFlags;
	create: () => (() => void) | void;
	deps: Array<any> | void | null;
	next: Effect | null;
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
	workInProgress.updateQueue = null;

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
		if (workInProgressHook) {
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
		};
		if (workInProgressHook) {
			workInProgressHook = workInProgressHook.next = hook;
		} else {
			// hook单链表的头节点
			workInProgressHook = currentlyRenderingFiber!.memoizedState = hook;
		}
	}

	return hook;
}

export function useReducer<S, I, A>(
	reducer: ((state: S, action: A) => S) | null,
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
	if (!currentlyRenderingFiber?.alternate) {
		// mount
		hook.memoizedState = initialState;
	}

	// ! 3. dispatch
	const dispatch = dispatchReducerAction.bind(
		null,
		currentlyRenderingFiber as Fiber,
		hook,
		reducer as any
	);
	return [hook.memoizedState, dispatch];
}

function dispatchReducerAction<S, I, A>(
	fiber: Fiber,
	hook: Hook,
	reducer: (state: S, action: A) => S,
	action: A
) {
	hook.memoizedState = reducer ? reducer(hook.memoizedState, action) : action;
	fiber.alternate = { ...fiber };
	const root = getRootForUpdateFiber(fiber);
	// 调度更新
	scheduleUpdateOnFiber(root, fiber, true);
}

function getRootForUpdateFiber(sourceFiber: Fiber): FiberRoot {
	let node = sourceFiber;
	let parent = node.return;

	while (parent !== null) {
		node = parent;
		parent = node.return;
	}

	return node.tag === HostRoot ? node.stateNode : null;
}

// 源码中useReducer和useState对比
// useState,如果state没有改变，不引起组件更新。useReducer，每次都会引起组件更新
// useReducer,代表state修改规则，useReducer比较方便复用这个规则
export function useState<S>(initialState: (() => S) | S) {
	const init = isFn(initialState) ? (initialState as any)() : initialState;
	return useReducer(null, init);
}

export function useMemo<T>(
	nextCreate: () => T,
	deps: Array<any> | void | null
): T {
	const hook = updateWorkInProgressHook();

	const nextDeps = deps === undefined ? null : deps;

	const prevState = hook.memoizedState;

	// 检查依赖是否发生变化
	if (prevState !== null) {
		if (nextDeps !== null) {
			const prevDeps = prevState[1];

			if (areHookInputsEqual(nextDeps, prevDeps)) {
				// 依赖项没有发生变化，返回上一次计算的结果，就是缓存的值
				return prevState[0];
			}
		}
	}

	const nextValue = nextCreate();

	hook.memoizedState = [nextValue, nextDeps];

	return nextValue;
}

export function useCallback<T>(callback: T, deps: Array<any> | void | null): T {
	const hook = updateWorkInProgressHook();

	const nextDeps = deps === undefined ? null : deps;

	const prevState = hook.memoizedState;

	// 检查依赖是否发生变化
	if (prevState !== null) {
		if (nextDeps !== null) {
			const prevDeps = prevState[1];

			if (areHookInputsEqual(nextDeps, prevDeps)) {
				// 依赖项没有发生变化，返回缓存的callback
				return prevState[0];
			}
		}
	}

	hook.memoizedState = [callback, nextDeps];

	return callback;
}

export function useRef<T>(initialValue: T): { current: T } {
	const hook = updateWorkInProgressHook();
	if (currentHook === null) {
		hook.memoizedState = { current: initialValue };
	}
	return hook.memoizedState;
}

// 检查hook依赖项是否发生改变
export function areHookInputsEqual(
	nextDeps: Array<any>,
	prevDeps: Array<any> | null
) {
	if (prevDeps === null) {
		return false;
	}

	for (let i = 0; i < prevDeps.length && i < nextDeps.length; i++) {
		if (Object.is(prevDeps[i], nextDeps[i])) {
			continue;
		}
		return false;
	}
	return true;
}

// useEffect和useLayoutEffect的区别
// 存储结构一样
// effect和destory函数的执行时间不同
export function useLayoutEffect(
	create: () => (() => void) | void,
	deps: Array<any> | void | null
) {
	return updateEffectImpl(Update, HookLayout, create, deps);
}

export function useEffect(
	create: () => (() => void) | void,
	deps: Array<any> | void | null
) {
	return updateEffectImpl(Passive, HookPassive, create, deps);
}

// 存储effect
function updateEffectImpl(
	fiberFlags: Flags,
	hookFlags: HookFlags,
	create: () => (() => void) | void,
	deps: Array<any> | void | null
) {
	const hook = updateWorkInProgressHook();

	const nextDeps = deps === undefined ? null : deps;

	// 依赖项是否发生变化
	if (currentHook !== null) {
		if (nextDeps !== null) {
			const prevDeps = currentHook.memoizedState.deps;
			if (areHookInputsEqual(nextDeps, prevDeps)) {
				return;
			}
		}
	}
	currentlyRenderingFiber!.flags |= fiberFlags;
	// * 1. 保存effect  2. 构建effect链表
	hook.memoizedState = pushEffect(hookFlags, create, deps);
}

function pushEffect(
	hookFlags: HookFlags,
	create: () => (() => void) | void,
	deps: Array<any> | void | null
) {
	const effect: Effect = {
		tag: hookFlags,
		create,
		deps,
		next: null,
	};

	let componentUpdateQueue = currentlyRenderingFiber!.updateQueue;
	// 单向循环链表
	if (componentUpdateQueue === null) {
		// 第一个effect
		componentUpdateQueue = {
			lastEffect: null,
		};
		currentlyRenderingFiber!.updateQueue = componentUpdateQueue;
		componentUpdateQueue.lastEffect = effect.next = effect;
	} else {
		const lastEffect = componentUpdateQueue.lastEffect;
		const firstEffect = lastEffect.next;
		lastEffect.next = effect;
		effect.next = firstEffect;
		componentUpdateQueue.lastEffect = effect;
	}

	return effect;
}

export function useContext<T>(context: ReactContext<T>) {
	return readContext(context);
}
