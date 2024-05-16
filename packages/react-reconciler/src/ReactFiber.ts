import type { ReactElement } from "shared/ReactElementType";
import { NoFlags } from "./ReactFiberFlags";
import type { Fiber } from "./ReactInternalTypes";
import { ClassComponent, Fragment, FunctionComponent, HostComponent, HostText, IndeterminateComponent, WorkTag } from "./ReactWorkTags";
import { isFn, isStr } from "shared/utils";
import { REACT_FRAGMENT_TYPE} from "shared/ReactSymbols"



// 创建一个fiber 
export function createFiber(
	tag: WorkTag,
	pendingProps: any,
	key: string | null
): Fiber {
	return new (FiberNode as any)(tag, pendingProps, key);
}

function FiberNode(this: any, tag: WorkTag, pendingProps: any, key: string | null) {
	// 赋值
	this.tag = tag;
	this.key = key;
	this.pendingProps = pendingProps;

	// 初始化
	this.elementType = null;
	this.type = null;
	this.stateNode = null;
	this.return = null;
	this.child = null;
	this.sibling = null;
	this.index = 0;
	this.memoizedProps = null;
	this.memoizedState = null;
	this.flags = NoFlags;
	this.alternate = null;
	this.deletions = null;
}

// 根据 ReactElement 创建fiber
export function createFiberFromElement(element: ReactElement): Fiber {
	const { key, type } = element;
	const pendingProps = element.props;
	const fiber = createFiberFromTypeAndProps(type, key, pendingProps);
	return fiber;
}

// 根据TypeAndProps创建fiber
export function createFiberFromTypeAndProps(
	type: any,
	key: string | null,
	pendingProps: any
): Fiber {
	let fiberTag: WorkTag = IndeterminateComponent;

	// todo 更多的tag
	if(isFn(type)) {
		// 函数组件 类组件
		if(type.prototype.isReactComponent) {
			fiberTag = ClassComponent;
		} else {
			fiberTag = FunctionComponent;
		}
	} else if (isStr(type)) {
		// 原生标签
		fiberTag = HostComponent;
	} else if (type === REACT_FRAGMENT_TYPE) {
		fiberTag =Fragment;
	} else if (isFn(type)) {
		fiberTag = FunctionComponent;
	} else {
		fiberTag = ClassComponent;
	}


	const fiber = createFiber(fiberTag, pendingProps, key);
	fiber.elementType = type;
	fiber.type = type;
	return fiber;
}


// This is used to create an alternate fiber to do work on.
// * 入口位置包括 1. prepareFreshStack 2. 复用节点 useFiber
export function createWorkInProgress(current: Fiber, pendingProps: any): Fiber {
    let workInProgress = current.alternate;

    if(workInProgress === null) {
        workInProgress = createFiber(current.tag, pendingProps, current.key);
        workInProgress.elementType = current.elementType;
        workInProgress.type = current.type;
        workInProgress.stateNode = current.stateNode;

        workInProgress.alternate = current;
        current.alternate = workInProgress;
    } else {
        workInProgress.pendingProps = pendingProps;
        workInProgress.type = current.type;
        workInProgress.flags = NoFlags;
    }

    workInProgress.flags = current.flags;

    workInProgress.child = current.child;
    workInProgress.sibling =current.sibling;
    workInProgress.memoizedProps = current.memoizedProps;
    workInProgress.memoizedState = current.memoizedState;
    workInProgress.index = current.index;

    return workInProgress;
}

export function createFiberFromText(content: string): Fiber {
    const fiber = createFiber(HostText, content, null);
    return fiber;
}