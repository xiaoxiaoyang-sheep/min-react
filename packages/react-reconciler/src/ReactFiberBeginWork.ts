/*
 * @Author: xiaoxiaoyang-sheep 904852749@qq.com
 * @Date: 2024-05-09 16:59:50
 * @LastEditors: xiaoxiaoyang-sheep 904852749@qq.com
 * @LastEditTime: 2024-06-12 20:56:59
 * @FilePath: /min-react/packages/react-reconciler/src/ReactFiberBeginWork.ts
 * @Description: 这是默认设置,请设置`customMade`, 打开koroFileHeader查看配置 进行设置: https://github.com/OBKoro1/koro1FileHeader/wiki/%E9%85%8D%E7%BD%AE
 */
import { isNum, isStr } from "shared/utils";
import type { Fiber } from "./ReactInternalTypes";
import {
	HostComponent,
	HostRoot,
	Fragment,
	HostText,
	ClassComponent,
	FunctionComponent,
	ContextProvider,
	ContextConsumer,
} from "./ReactWorkTags";
import { reconcileChildFibers, mountChildFibers } from "./ReactChildFiber";
import { renderWithHooks } from "./ReactFiberHooks";
import { pushProvider, readContext } from "./ReactFiberNewContext";

// 1. 处理当前fiber，因为不同组件对应的fiber处理方式不同
// 2. 返回子节点child
function beginWork(current: Fiber | null, workInProgress: Fiber): Fiber | null {
	switch (workInProgress.tag) {
		case HostRoot:
			return updateHostRoot(current, workInProgress);
		case HostComponent:
			return updateHostComponent(current, workInProgress);
		case HostText:
			return updateHostText(current, workInProgress);
		case Fragment:
			return updateFragment(current, workInProgress);
		case ClassComponent:
			return updateClassComponent(current, workInProgress);
		case FunctionComponent:
			return updateFunctionComponent(current, workInProgress);
		case ContextProvider:
			return updateContextProvider(current, workInProgress);
		case ContextConsumer:
			return updateContextConsumer(current, workInProgress);

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

	if (current) {
		current.child = workInProgress.child;
	}

	return workInProgress.child;
}

// 原生标签 div span ...
// 初次渲染 协调
// todo 更新 协调、bailout
function updateHostComponent(current: null | Fiber, workInProgress: Fiber) {
	// 如果原生标签只有一个文本，这个时候文本不会再生成fiber节点，而是当作这个原生标签的属性
	const { type, pendingProps } = workInProgress;
	const isDirectTextChild = shouldSetTextContent(type, pendingProps);
	if (isDirectTextChild) {
		// 文本属性
		return null;
	}
	const nextChildren = workInProgress.pendingProps.children;
	reconcileChildren(current, workInProgress, nextChildren);

	return workInProgress.child;
}

// 文本没有子节点，不需要协调
function updateHostText(current: null | Fiber, workInProgress: Fiber) {
	return null;
}

function updateFragment(current: null | Fiber, workInProgress: Fiber) {
	const nextChildren = workInProgress.pendingProps.children;
	reconcileChildren(current, workInProgress, nextChildren);
	return workInProgress.child;
}

// 更新自己
// 协调
function updateClassComponent(current: null | Fiber, workInProgress: Fiber) {
	const { type, pendingProps } = workInProgress;
	const context = type.contextType
	const newValue = readContext(context)
	let instance = workInProgress.stateNode
	if(current === null) {
		instance = new type(pendingProps)
		workInProgress.stateNode = instance
	}
	instance.context = newValue
	const children = instance.render();
	reconcileChildren(current, workInProgress, children);
	return workInProgress.child;
}

function updateFunctionComponent(current: null | Fiber, workInProgress: Fiber) {
	const { type, pendingProps } = workInProgress;
	const children = renderWithHooks(
		current,
		workInProgress,
		type,
		pendingProps
	);
	reconcileChildren(current, workInProgress, children);
	return workInProgress.child;
}

function updateContextProvider(current: null | Fiber, workInProgress: Fiber) {
	const context = workInProgress.type._context;
	const value = workInProgress.pendingProps.value;

	// 1. 记录下context value到stack， 2. 可以让后代组件消费 3. 消费完出栈
	// 数据结构存储 stack 先进后出
	pushProvider(context, value);

	reconcileChildren(
		current,
		workInProgress,
		workInProgress.pendingProps.children
	);
	return workInProgress.child;
}

function updateContextConsumer(current: null | Fiber, workInProgress: Fiber) {
	const context = workInProgress.type
	const newValue = readContext(context)

	const render = workInProgress.pendingProps.children
	const newChildren = render(newValue)
	reconcileChildren(current, workInProgress, newChildren)
	return workInProgress.child
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
