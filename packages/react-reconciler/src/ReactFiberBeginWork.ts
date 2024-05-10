import { isNum, isStr } from "shared/utils";
import type { Fiber } from "./ReactInternalTypes";
import { HostComponent, HostRoot } from "./ReactWorkTags";
import { reconcileChildFibers, mountChildFibers} from "./ReactChildFiber";

// 1. 处理当前fiber，因为不同组件对应的fiber处理方式不同
// 2. 返回子节点child
function beginWork(current: Fiber | null, workInProgress: Fiber): Fiber | null {
	switch (workInProgress.tag) {
		case HostRoot:
			return updateHostRoot(current, workInProgress);
		case HostComponent:
			return updateHostComponent(current, workInProgress);
		// todo
	}

	throw new Error(
		`Unknown unit of work tag (${workInProgress.tag}). This error is likely caused by a bug in ` +
			"React. Please file an issue."
	);
}

// 根fiber
function updateHostRoot(current: null | Fiber, workInProgress: Fiber) {
	const nextChildren = workInProgress.memoizedState.element;

	reconcileChildren(current, workInProgress, nextChildren);

	return workInProgress.child;
}

// 原生标签 div span ...
// 初次渲染 协调
// todo 更新 协调、bailout
function updateHostComponent(current: null | Fiber, workInProgress: Fiber) {
	// 如果原生标签只有一个文本，这个时候文本不会再生成fiber节点，而是当作这个原生标签的属性
    const { type, pendingProps } = workInProgress;
    const isDirectTextChild = shouldSetTextContent(type, pendingProps);
    if(isDirectTextChild) {
        // 文本属性
        return null;
    }
	const nextChildren = workInProgress.pendingProps.children;
	reconcileChildren(current, workInProgress, nextChildren);

    return workInProgress.child;
}

// 协调子节点，构建新的fiber树
function reconcileChildren(
	current: null | Fiber,
	workInProgress: Fiber,
	nextChildren: any
) {
	if (current === null) {
		// 初次挂载
		workInProgress.child = mountChildFibers(
			workInProgress,
			null,
			nextChildren
		);
	} else {
		// 更新
		workInProgress.child = reconcileChildFibers(
			workInProgress,
			current.child,
			nextChildren
		);
	}
}

function shouldSetTextContent(type: string, props: any): boolean {
	return (
		type === "textarea" ||
		type === "noscript" ||
		isStr(props.children) ||
		isNum(props.children) ||
		(typeof props.dangerouslySetInnerHTML === "object" &&
			props.dangerouslySetInnerHTML !== null &&
			props.dangerouslySetInnerHTML.__html !== null)
	);
}

export { beginWork };
