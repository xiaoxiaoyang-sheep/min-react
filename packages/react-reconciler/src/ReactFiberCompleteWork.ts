import { isNum, isStr } from "shared/utils";
import type { Fiber } from "./ReactInternalTypes";
import {
	ClassComponent,
	Fragment,
	FunctionComponent,
	HostComponent,
	HostRoot,
	HostText,
} from "./ReactWorkTags";

function completeWork(
	current: Fiber | null,
	workInProgress: Fiber
): Fiber | null {
	const newProps = workInProgress.pendingProps;

	switch (workInProgress.tag) {
		case Fragment:
		case ClassComponent:
		case FunctionComponent:
		case HostRoot: {
			return null;
		}
		case HostComponent: {
			// 原生标签，type是标签名
			const { type } = workInProgress;
			if (current !== null && workInProgress.stateNode !== null) {
				updateHostComponent(current, workInProgress, type, newProps);
			} else {
				// 1. 创建真实dom
				const instance = document.createElement(type);
				// 2. 初始化dom属性
				finalizeInitialChildren(instance, null, newProps);
				// 3. 把子dom挂载到父dom上
				appendAllChildren(instance, workInProgress);
				workInProgress.stateNode = instance;
			}
			return null;
		}
		case HostText: {
			workInProgress.stateNode = document.createTextNode(newProps);
			return null;
		}
		// todo
	}

	throw new Error(
		`Unknown unit of work tag (${workInProgress.tag}). This error is likely caused by a bug in ` +
			"React. Please file an issue."
	);
}

function updateHostComponent(
	current: Fiber | null,
	workInProgress: Fiber,
	type: string,
	newProps: any
) {
	if (current?.memoizedState === newProps) {
		return;
	}

	finalizeInitialChildren(
		workInProgress.stateNode,
		current?.memoizedProps,
		newProps
	);
}

// 初始化、更新属性
// old {className="red", onClick: f, data-red="red"}
// new {className="red blue", onCLick: f}
function finalizeInitialChildren(
	domElement: Element,
	prevProps: any,
	nextProps: any
) {
	// 遍历老的props
	for (const propKey in prevProps) {
		const prevProp = prevProps[propKey];
		if (propKey === "children") {
			if (isStr(prevProp) || isNum(prevProp)) {
				// 属性
				domElement.textContent = "";
			}
		} else {
			// 设置属性
			if (propKey === "onClick") {
				domElement.removeEventListener("click", prevProp);
			} else {
				if (!(prevProp in nextProps)) {
					(domElement as any)[propKey] = "";
				}
			}
		}
	}

	// 遍历新的props
	for (const propKey in nextProps) {
		const nextProp = nextProps[propKey];
		if (propKey === "children") {
			if (isStr(nextProp) || isNum(nextProp)) {
				// 属性
				domElement.textContent = nextProp;
			}
		} else {
			// 设置属性
			if (propKey === "onClick") {
				domElement.addEventListener("click", nextProp);
			} else {
				(domElement as any)[propKey] = nextProp;
			}
		}
	}
}

function appendAllChildren(parent: Element, workInProgress: Fiber) {
	let nodeFiber = workInProgress.child; // 链表结构
	while (nodeFiber !== null) {
		if (isHost(nodeFiber)) {
			parent.appendChild(nodeFiber.stateNode); // nodeFiber.stateNode是DOM节点
		} else if (nodeFiber.child !== null) {
			nodeFiber = nodeFiber.child;
			continue;
		}

		if (nodeFiber === workInProgress) return;
		while (nodeFiber.sibling === null) {
			if (
				nodeFiber.return === null ||
				nodeFiber.return === workInProgress
			) {
				return;
			}
			nodeFiber = nodeFiber.return;
		}

		nodeFiber = nodeFiber.sibling;
	}
}

export function isHost(fiber: Fiber): boolean {
	return fiber.tag === HostComponent || fiber.tag === HostText;
}

export { completeWork };
