import { ReactElement } from "shared/ReactElementType";
import { Fiber } from "./ReactInternalTypes";
import { createFiberFromElement } from "./ReactFiber";
import { Placement } from "./ReactFiberFlags";
import { REACT_ELEMENT_TYPE } from "shared/ReactSymbols";

type ChildReconciler = (
	returnFiber: Fiber,
	currentFirstChild: Fiber | null,
	newChild: any
) => Fiber | null;

export const reconcileChildFibers: ChildReconciler =
	createChildReconciler(true);
export const mountChildFibers: ChildReconciler = createChildReconciler(false);

// wrapper function
function createChildReconciler(shouldTrackSideEffects: boolean) {
	// 给fiber节点添加flags
	function placeSingleChild(newFiber: Fiber) {
		if (shouldTrackSideEffects && newFiber.alternate === null) {
			newFiber.flags |= Placement;
		}
		return newFiber;
	}

	// 协调单个节点，对于页面初次渲染，创建fiber，不涉及对比复用老节点
	function reconcileSingleElement(
		returnFiber: Fiber,
		currentFirstChild: Fiber | null,
		newChild: ReactElement
	) {
		let createdFiber = createFiberFromElement(newChild);
		createdFiber.return = returnFiber;
		return createdFiber;
	}

	function reconcileChildFibers(
		returnFiber: Fiber,
		currentFirstChild: Fiber | null,
		newChild: any
	): Fiber | null {
		// 检查newChild类型，单个节点、文本、数组
		if (typeof newChild === "object" && newChild !== null) {
			switch (newChild.$$typeof) {
				case REACT_ELEMENT_TYPE: {
					return placeSingleChild(
						reconcileSingleElement(
							returnFiber,
							currentFirstChild,
							newChild
						)
					);
				}
			}
		}
		// todo

		return null;
	}

	return reconcileChildFibers;
}
