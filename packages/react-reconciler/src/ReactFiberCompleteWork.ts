import { isNum, isStr } from "shared/utils";
import type { Fiber } from "./ReactInternalTypes";
import { HostComponent, HostRoot, HostText } from "./ReactWorkTags";

function completeWork(
	current: Fiber | null,
	workInProgress: Fiber
): Fiber | null {
    const newProps = workInProgress.pendingProps;

	switch (workInProgress.tag) {
		case HostRoot: {
			return null;
		}
		case HostComponent: {
			// 原生标签，type是标签名
			const { type } = workInProgress;
			// 1. 创建真实dom
			const instance = document.createElement(type);
			// 2. 初始化dom属性
			finalizeInitialChildren(instance, newProps);
			// 3. 把子dom挂载到父dom上
            appendAllChildren(instance, workInProgress);
            workInProgress.stateNode = instance;
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

// 初始化属性
function finalizeInitialChildren(domElement: Element, props: any) {
	for (const propKey in props) {
		const nextProp = props[propKey];
		if (propKey === "children") {
			if (isStr(nextProp) || isNum(nextProp)) {
				// 属性
				domElement.textContent = nextProp;
			}
		} else {
			// 设置属性
			(domElement as any)[propKey] = nextProp;
		}
	}
}

function appendAllChildren(parent: Element, workInProgress: Fiber) {
    let nodeFiber = workInProgress.child; // 链表结构
    while(nodeFiber !== null) { 
        parent.appendChild(nodeFiber.stateNode);
        nodeFiber = nodeFiber.sibling;
    }
}

export { completeWork };
