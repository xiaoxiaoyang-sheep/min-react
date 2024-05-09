import { ReactElement } from "shared/ReactElementType";
import { Flags, NoFlags } from "./ReactFiberFlags";
import { Fiber } from "./ReactInternalTypes";
import { ClassComponent, FunctionComponent, HostComponent, IndeterminateComponent, WorkTag } from "./ReactWorkTags";
import { isFn, isStr } from "shared/utils";



// 创建一个fiber
export function createFiber(
	tag: WorkTag,
	pendingProps: any,
	key: string | null
): Fiber {
	return new FiberNode(tag, pendingProps, key);
}

function FiberNode(tag: WorkTag, pendingProps: any, key: string | null) {
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
}

// 根据 ReactElement 创建fiber
export function createFiberFromELement(element: ReactElement): Fiber {
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
	if (isStr(type)) {
		// 原生标签
		fiberTag = HostComponent;
	} else if (isFn(type)) {
		fiberTag = FunctionComponent;
	} else {
		fiberTag = ClassComponent;
	}

	const fiber = createFiber(fiberTag, key, pendingProps);
	fiber.elementType = type;
	fiber.type = type;
	return fiber;
}
