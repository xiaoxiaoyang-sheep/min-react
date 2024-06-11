import { isHost } from "./ReactFiberCompleteWork";
import { ChildDeletion, Passive, Placement, Update } from "./ReactFiberFlags";
import { HookFlags, HookLayout, HookPassive } from "./ReactHookEffectTags";
import type { Fiber, FiberRoot } from "./ReactInternalTypes";
import {
	FunctionComponent,
	HostComponent,
	HostRoot,
	HostText,
} from "./ReactWorkTags";

export function commitMutationEffects(root: FiberRoot, finishedWork: Fiber) {
	// 1. 遍历
	recursivelyTraverseMutationEffects(root, finishedWork);
	// 提交协调产生的effect，比如flags，Placement、Update、ChildDeletion等
	commitReconciliationEffects(finishedWork);
}

function recursivelyTraverseMutationEffects(
	root: FiberRoot,
	parentFiber: Fiber
) {
	let child = parentFiber.child;
	// 遍历单链表
	while (child !== null) {
		commitMutationEffects(root, child);
		child = child.sibling;
	}
}

function commitReconciliationEffects(finishedWork: Fiber) {
	const flags = finishedWork.flags;
	if (flags & Placement) {
		// 页面初次渲染 新增插入 appendChild
		// todo 页面更新，修改位置 appendChild || insertBefore
		commitPlacement(finishedWork);
		// 移除flag
		finishedWork.flags &= ~Placement;
	}

	if (flags & ChildDeletion) {
		// parentFiber 是 deletions的父dom对应的fiber
		const parentFiber = isHostParent(finishedWork)
			? finishedWork
			: getHostParentFiber(finishedWork);
		const parentDom = parentFiber.stateNode;
		commitDeletions(finishedWork.deletions!, parentDom);

		finishedWork.flags &= ~ChildDeletion;
		finishedWork.deletions = null;
	}

	if (flags & Update) {
		if ((finishedWork.tag === FunctionComponent)) {
			// 执行 layout effect
			commitHookEffectListMount(HookLayout, finishedWork);
			finishedWork.flags &= ~Update;
		}
	}
}

function commitHookEffectListMount(hookFlags: HookFlags, finishedWork: Fiber) {
	const updateQueue = finishedWork.updateQueue;
	let lastEffect = updateQueue!.lastEffect;
	if (lastEffect !== null) {
		const firstEffect = lastEffect.next;
		let effect = firstEffect;
		do {
			if ((effect.tag & hookFlags) === hookFlags) {
				const create = effect.create;
				create();
			}
			effect = effect.next;
		} while (effect !== firstEffect);
	}
}

// 根据fiber删除dom节点， 父dom， 子dom
function commitDeletions(
	deletions: Array<Fiber>,
	parentDom: Element | Document | DocumentFragment
) {
	deletions.forEach((deletion) => {
		parentDom.removeChild(getStateNode(deletion));
	});
}

function getStateNode(fiber: Fiber) {
	let node = fiber;
	while (1) {
		if (isHost(node) && node.stateNode) {
			return node.stateNode;
		}
		node = node.child as Fiber;
	}
}

function commitPlacement(finishedWork: Fiber) {
	// parentDom.appendChild(domNode)
	if (finishedWork.stateNode && isHost(finishedWork)) {
		// finishedWork是有dom节点
		const domNode = finishedWork.stateNode;
		// 找到domNode的父dom节点对应的fiber
		const parentFiber = getHostParentFiber(finishedWork);
		let parentDom = parentFiber.stateNode;

		if (parentDom.containerInfo) {
			// HostRoot
			parentDom = parentDom.containerInfo;
		}

		// 遍历fiber，寻找finishedWork的兄弟节点，并且这个siblings是有dom节点，且是更新的节点。并且在本轮不发生移动
		const before = getHostSibling(finishedWork);
		insertOrAppendPlacementNode(finishedWork, before, parentDom);
	} else {
		// Fragment
		let kid = finishedWork.child;
		while (kid !== null) {
			commitPlacement(kid);
			kid = kid.sibling;
		}
	}
}

function insertOrAppendPlacementNode(
	node: Fiber,
	before: Element,
	parent: Element
) {
	if (before) {
		parent.insertBefore(getStateNode(node), before);
	} else {
		parent.appendChild(getStateNode(node));
	}
}

function getHostSibling(fiber: Fiber) {
	let node = fiber;
	sibing: while (1) {
		while (node.sibling === null) {
			if (node.return === null || isHostParent(node.return)) {
				return null;
			}
			node = node.return;
		}

		node = node.sibling;
		while (!isHost(node)) {
			// 新增插入 | 移动位置
			if (node.flags & Placement) {
				continue sibing;
			}

			if (node.child === null) {
				continue sibing;
			} else {
				node = node.child;
			}
		}

		// HostComponent | HostText
		if (!(node.flags & Placement)) {
			return node.stateNode;
		}
	}
}

function getHostParentFiber(fiber: Fiber): Fiber {
	let parent = fiber.return;
	while (parent !== null) {
		if (isHostParent(parent)) {
			return parent;
		}
		parent = parent.return;
	}

	throw new Error(
		"Expected to find a host parent. This error is likely caused by a bug " +
			"in React. Please file an issue."
	);
}

// 检查fiber是HostParent
function isHostParent(fiber: Fiber): boolean {
	return fiber.tag === HostComponent || fiber.tag === HostRoot;
}

export function flushPassiveEffects(finishedWork: Fiber) {
	// ! 1. 遍历子节点，检查子节点
	recursivelyTraversePassiveMountEffects(finishedWork);
	// ! 2. 如果有passive effect，执行
	commitPassiveEffects(finishedWork);
}

function recursivelyTraversePassiveMountEffects(finishedWork: Fiber) {
	let child = finishedWork.child;
	while (child !== null) {
		// ! 1. 遍历子节点，检查子节点
		recursivelyTraversePassiveMountEffects(child);
		// ! 2. 如果有passive effect，执行
		commitPassiveEffects(child);
		child = child.sibling;
	}
}

function commitPassiveEffects(finishedWork: Fiber) {
	switch (finishedWork.tag) {
		case FunctionComponent:
			if (finishedWork.flags & Passive) {
				commitHookEffectListMount(HookPassive, finishedWork);
				finishedWork.flags &= ~Passive;
			}
			break;
	}
}
