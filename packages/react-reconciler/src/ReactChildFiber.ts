import type { ReactElement } from "shared/ReactElementType";
import type { Fiber } from "./ReactInternalTypes";
import {
	createFiberFromElement,
	createFiberFromText,
	createWorkInProgress,
} from "./ReactFiber";
import { ChildDeletion, Placement } from "./ReactFiberFlags";
import { REACT_ELEMENT_TYPE } from "shared/ReactSymbols";
import { isArray, isText } from "shared/utils";
import { HostText } from "./ReactWorkTags";

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
	function deleteChild(returnFiber: Fiber, childToDelete: Fiber) {
		if (!shouldTrackSideEffects) {
			return;
		}

		const deletions = returnFiber.deletions;
		if (deletions === null) {
			returnFiber.deletions = [childToDelete];
			returnFiber.flags |= ChildDeletion;
		} else {
			returnFiber.deletions!.push(childToDelete);
		}
	}

	function deleteRemainingChildren(
		returnFiber: Fiber,
		currentFirstChild: Fiber
	) {
		if (!shouldTrackSideEffects) {
			return;
		}

		let childToDelete: Fiber | null = currentFirstChild;
		while (childToDelete !== null) {
			deleteChild(returnFiber, childToDelete);
			childToDelete = childToDelete.sibling;
		}

		return null;
	}

	// 给fiber节点添加flags
	function placeSingleChild(newFiber: Fiber) {
		if (shouldTrackSideEffects && newFiber.alternate === null) {
			newFiber.flags |= Placement;
		}
		return newFiber;
	}

	// 文本
	function reconcileSingleTextNode(
		returnFiber: Fiber,
		currentFirstChild: Fiber | null, // todo 更新
		textContent: string
	) {
		const created = createFiberFromText(textContent);
		created.return = returnFiber;
		return created;
	}

	function useFiber(fiber: Fiber, pendingProps: any) {
		const clone = createWorkInProgress(fiber, pendingProps);
		clone.index = 0;
		clone.sibling = null;
		return clone;
	}

	// 协调单个节点，对于页面初次渲染，创建fiber，不涉及对比复用老节点
	function reconcileSingleElement(
		returnFiber: Fiber,
		currentFirstChild: Fiber | null,
		element: ReactElement
	) {
		// 节点复用条件
		// ! 1. 同一层级下 2. key相同 3. 类型相同
		const key = element.key;
		let child = currentFirstChild;

		while (child !== null) {
			if (child.key === key) {
				const elementType = element.type;
				if (child.elementType === elementType) {
					// todo 后面其它fiber可以删除了
					const existing = useFiber(child, element.props);
					existing.return = returnFiber;
					return existing;
				} else {
					// 前提: React不认为同一层级下有两个相同的key值
					deleteRemainingChildren(returnFiber, child);
					break;
				}
			} else {
				// 删除单个节点
				deleteChild(returnFiber, child);
			}
			// 老fiber是一个单链表
			child = child.sibling;
		}

		let createdFiber = createFiberFromElement(element);
		createdFiber.return = returnFiber;
		return createdFiber;
	}

	function createChild(returnFiber: Fiber, newChild: any): Fiber | null {
		if (isText(newChild)) {
			const created = createFiberFromText(newChild + "");
			created.return = returnFiber;
			return created;
		}

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

	function updateTextNode(
		returnFiber: Fiber,
		current: Fiber | null,
		textContent: string
	) {
		if (current === null || current.tag !== HostText) {
			// 老节点不是文本
			const created = createFiberFromText(textContent);
			created.return = returnFiber;
			return created;
		} else {
			// 老节点是文本
			const existing = useFiber(current, textContent);
			existing.return = returnFiber;
			return existing;
		}
	}

	function updateElement(
		returnFiber: Fiber,
		current: Fiber | null,
		element: ReactElement
	) {
		const elementType = element.type;
		if (current !== null) {
			if (current.elementType === elementType) {
				// 类型相同
				const existing = useFiber(current, element.props);
				existing.return = returnFiber;
				return existing;
			}
		}

		const created = createFiberFromElement(element);
		created.return = returnFiber;
		return created;
	}

	function updateSlot(
		returnFiber: Fiber,
		oldFiber: Fiber | null,
		newChild: any
	) {
		// 判断节点是否可以复用
		const key = oldFiber !== null ? oldFiber.key : null;
		if (isText(newChild)) {
			if (key !== null) {
				// 新节点是文本， 老节点不是文本
				return null;
			}
			// 有可能可以复用
			return updateTextNode(returnFiber, oldFiber, newChild);
		}

		if (typeof newChild === "object" && newChild !== null) {
			if (newChild.key === key) {
				return updateElement(returnFiber, oldFiber, newChild);
			} else {
				return null;
			}
		}
	}

	function updateFromMap(
		existingChildren: Map<string | number, Fiber>,
		returnFiber: Fiber,
		newIdx: number,
		newChild: any
	) {
		if (isText(newChild)) {
			const matchedFiber = existingChildren.get(newIdx) || null;
			return updateTextNode(returnFiber, matchedFiber, newChild + "");
		} else {
			const matchedFiber =
				existingChildren.get(
					newChild.key === null ? newIdx : newChild.key
				) || null;
			return updateElement(returnFiber, matchedFiber, newChild);
		}
	}

	function placeChild(
		newFiber: Fiber,
		lastPlacedIndex: number, // 记录的是新fiber在老fiber上的位置
		newIndex: number
	) {
		newFiber.index = newIndex;

		if (!shouldTrackSideEffects) {
			return lastPlacedIndex;
		}

		// 判断节点位置是否发生相对位置变化，是否需要移动
		const current = newFiber.alternate;
		if (current !== null) {
			const oldIndex = current.index;
			if (oldIndex < lastPlacedIndex) {
				// 节点需要移动位置
				newFiber.flags |= Placement;
				return lastPlacedIndex;
			} else {
				return oldIndex;
			}
		} else {
			// 节点是新增的
			newFiber.flags |= Placement;
			return lastPlacedIndex;
		}
	}

	function mapRemainingChildren(
		oldFiber: Fiber
	): Map<string | number, Fiber> {
		const existingChildren: Map<string | number, Fiber> = new Map();
		let existingChild: Fiber | null = oldFiber;

		while (existingChild !== null) {
			if (existingChild.key !== null) {
				existingChildren.set(existingChild.key, existingChild);
			} else {
				existingChildren.set(existingChild.index, existingChild);
			}

			existingChild = existingChild.sibling;
		}

		return existingChildren;
	}

	function reconcileChildrenArray(
		returnFiber: Fiber,
		currentFirstChild: Fiber | null,
		newChildren: Array<any>
	): Fiber | null {
		let resultFirstChild: Fiber | null = null; // 头节点
		let previousNewFiber: Fiber | null = null;
		let oldFiber = currentFirstChild;
		let nextOldFiber: Fiber | null = null;
		let newIdx = 0;
		let lastPlacedIndex = 0;

		// * 大多数实际场景下，节点相对位置不变
		// ! 1. 从左往右遍历，按位置比较，如果可以复用那就复用，不能复用，推出本轮
		for (; oldFiber !== null && newIdx < newChildren.length; newIdx++) {
			if (oldFiber.index > newIdx) {
				nextOldFiber = oldFiber;
				oldFiber = null;
			} else {
				nextOldFiber = oldFiber.sibling;
			}
			const newFiber = updateSlot(
				returnFiber,
				oldFiber,
				newChildren[newIdx]
			);
			if (newFiber === null) {
				if (oldFiber === null) {
					oldFiber = nextOldFiber;
				}
				break;
			}

			if (shouldTrackSideEffects) {
				if (oldFiber && newFiber?.alternate === null) {
					deleteChild(returnFiber, oldFiber);
				}
			}

			// 判断节点在DOM的相对位置是否发生变化
			// 组件更新阶段，判断在更新前后的位置是否一致，如果不一致，需要移动
			lastPlacedIndex = placeChild(
				newFiber as Fiber,
				lastPlacedIndex,
				newIdx
			);

			if (previousNewFiber === null) {
				// 第一个节点，不要用newIdx判断，因为有可能有null，而null不是有效fiber
				resultFirstChild = newFiber as Fiber;
			} else {
				previousNewFiber.sibling = newFiber as Fiber;
			}

			previousNewFiber = newFiber as Fiber;

			oldFiber = nextOldFiber;
		}
		// * Vue 1.2 从右往左遍历，按位置比较，如果可以复用那就复用，不能复用，推出本轮

		// ! 2.1 老节点还有，新节点没了。删除剩余的老节点。
		if (newIdx === newChildren.length) {
			deleteRemainingChildren(returnFiber, oldFiber!);
			return resultFirstChild;
		}

		// ! 2.2 新节点还有，老节点没了。剩下的 新节点新增就可以了
		// 包括页面初次渲染
		if (oldFiber === null) {
			for (; newIdx < newChildren.length; newIdx++) {
				const newFiber = createChild(returnFiber, newChildren[newIdx]);
				if (newFiber === null) {
					// 无效节点跳过
					continue;
				}
				// 组件在更新阶段，判断在更新前后的位置是否一致，如果不一致，需要移动
				lastPlacedIndex = placeChild(newFiber, lastPlacedIndex, newIdx);

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

		// ! 2.3 新老节点都还有
		// 【0, 1, 2, 3, 4] [0, 1, 2, 4]
		// old 3 4
		// new 4
		// 构建map
		const existingChildren = mapRemainingChildren(oldFiber);
		for (; newIdx < newChildren.length; newIdx++) {
			const newFiber = updateFromMap(
				existingChildren,
				returnFiber,
				newIdx,
				newChildren[newIdx]
			);

			if(newFiber !== null) {
				if(shouldTrackSideEffects) {
					existingChildren.delete(newFiber.key === null ? newIdx : newFiber.key);
				}

				lastPlacedIndex = placeChild(newFiber, lastPlacedIndex, newIdx);
				if(previousNewFiber === null) {
					resultFirstChild = newFiber;
				} else {
					previousNewFiber.sibling = newFiber;
				}
				previousNewFiber = newFiber;
			}
		}

		// ! 3. 如果新节点已经构建完，但是老节点还有
		if(shouldTrackSideEffects) {
			existingChildren.forEach((child) => deleteChild(returnFiber, child));
		}

		return resultFirstChild;
	}

	function reconcileChildFibers(
		returnFiber: Fiber,
		currentFirstChild: Fiber | null,
		newChild: any
	): Fiber | null {
		if (isText(newChild)) {
			return placeSingleChild(
				reconcileSingleTextNode(
					returnFiber,
					currentFirstChild,
					newChild + ""
				)
			);
		}

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
		if (isArray(newChild)) {
			return reconcileChildrenArray(
				returnFiber,
				currentFirstChild,
				newChild
			);
		}

		// todo

		return null;
	}

	return reconcileChildFibers;
}
