import type { ReactElement } from "shared/ReactElementType";
import type { Fiber } from "./ReactInternalTypes";
import { createFiberFromElement } from "./ReactFiber";
import { Placement } from "./ReactFiberFlags";
import { REACT_ELEMENT_TYPE } from "shared/ReactSymbols";
import { isArray } from "shared/utils";

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

	function createChild(returnFiber: Fiber, newChild: any): Fiber | null {
		if (typeof newChild === "object" && newChild !== null) {
			switch (newChild.$$typeof) {
				case REACT_ELEMENT_TYPE: {
					const created = createFiberFromElement(newChild);
					created.return = returnFiber;
					return created;
				}
			}
		}

		return null;
	}

	function reconcileChildrenArray(
		returnFiber: Fiber,
		currentFirstChild: Fiber | null,
		newChildren: Array<any>
	): Fiber | null {
		let resultFirstChild: Fiber | null = null; // 头节点
		let previousNewFiber: Fiber | null = null;
		let oldFiber = currentFirstChild;
		let newIdx = 0;

		if (oldFiber === null) {
			for (; newIdx < newChildren.length; newIdx++) {
				const newFiber = createChild(returnFiber, newChildren[newIdx]);
				if (newFiber === null) {
					// 无效节点跳过
					continue;
				}
				newFiber.index = newIdx; // 组件在更新阶段，判断在更新前后的位置是否一致，如果不一致，需要移动

				if (previousNewFiber === null) {
                    // 第一个节点，不要用newIdx判断，因为有可能有null，而null不是有效fiber
					resultFirstChild = newFiber;
				} else {
					previousNewFiber.sibling = newFiber;
				}

				previousNewFiber = newFiber;
			}
			return resultFirstChild;
		}

		return resultFirstChild;
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

        // 子节点是数组
        if(isArray(newChild)) {
            return reconcileChildrenArray(returnFiber, currentFirstChild, newChild);
        }
        
		// todo

		return null;
	}

	return reconcileChildFibers;
}
