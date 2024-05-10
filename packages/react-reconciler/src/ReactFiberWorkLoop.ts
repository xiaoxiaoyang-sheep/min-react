import type { Fiber, FiberRoot } from "./ReactInternalTypes";
import { ensureRootIsScheduled } from "./ReactFiberRootScheduler";
import { createWorkInProgress } from "./ReactFiber";
import { beginWork } from "./ReactFiberBeginWork";
import { completeWork } from "./ReactFiberCompleteWork";
import { commitMutationEffects } from "./ReactFiberCommitWork";

type ExecutionContext = number;

export const NoContext = /*             */ 0b000;
const BatchedContext = /*               */ 0b001;
export const RenderContext = /*         */ 0b010;
export const CommitContext = /*         */ 0b100;

// 记录当前处于什么阶段
let executionContext: ExecutionContext = NoContext;

// 当前正在工作的fiber
let workInProgress: Fiber | null = null;
// 当前正在工作的fiberRoot
let workInProgressRoot: FiberRoot | null = null;

export function scheduleUpdateOnFiber(root: FiberRoot, fiber: Fiber) {
	workInProgress = fiber;
	workInProgressRoot = root;

	ensureRootIsScheduled(root);
}

// 这是每个并发任务的入口点，即通过Scheduler的所有内容。
export function performConcurrentWorkOnRoot(root: FiberRoot) {
	// ! 1. render, 构建fiber树VDOM(beginWork, completeWork)
	renderRootSync(root);

	console.log(
		"%c [ render ]-37",
		"font-size:13px; background:pink; color:#bf2c9f;",
		root
	);

	const finishedWork = root.current.alternate;
	root.finishedWork = finishedWork;
	// ! 2. commit, VDOM -> DOM
	// commitRoot(root);
}

function renderRootSync(root: FiberRoot) {
	// ! 1. render阶段开始
	const prevExecutionContext = executionContext;
	executionContext |= RenderContext;

	// ! 2. 初始化
	prepareFreshStack(root);

	// ! 3. 遍历构建fiber树
	workLoopSync();

	// ! 4. render结束
	executionContext = prevExecutionContext;
	workInProgressRoot = null;
}

function commitRoot(root: FiberRoot) {
    // ! 1. commit阶段开始
	const prevExecutionContext = executionContext;
	executionContext |= CommitContext;

	// ! 2. mutation阶段，渲染dom树
    commitMutationEffects(root, root.finishedWork);

	// ! 3. commit结束
	executionContext = prevExecutionContext;
	workInProgressRoot = null;
}

// 初始化。如workInProgressRoot、workInProgress、workInProgressRootRenderLanes
function prepareFreshStack(root: FiberRoot): Fiber {
	root.finishedWork = null;

	workInProgressRoot = root; // FiberRoot

	const rootWorkInProgress = createWorkInProgress(root.current, null);
	if (workInProgress === null) {
		workInProgress = rootWorkInProgress; // Fiber
	}

	return rootWorkInProgress;
}

// The work loop is an extremely hot path. Tell Closure not to inline it.
function workLoopSync() {
	while (workInProgress !== null) {
		performUnitOfWork(workInProgress);
	}
}

function performUnitOfWork(unitOfWork: Fiber): void {
	const current = unitOfWork.alternate;

	// ! 1. beginWork
	let next = beginWork(current, unitOfWork);

	// * 1.1 执行自己
	// * 1.2 （协调，bailout）返回子节点

	if (next === null) {
		// 没有产生新的work
		// ! 2. completeWork
		completeUnitOfWork(unitOfWork);
	} else {
		workInProgress = next;
	}
}

// 深度优先遍历，子节点 -> 兄弟节点 -> 叔叔节点 -> 爷爷的兄弟节点 ...
function completeUnitOfWork(unitOfWork: Fiber): void {
	let completedWork = unitOfWork;

	do {
		const current = completedWork.alternate;
		const returnFiber = completedWork.return;
		let next = completeWork(current, completedWork);
		if (next !== null) {
			workInProgress = next;
			return;
		}

		const siblingFiber = completedWork.sibling;
		if (siblingFiber !== null) {
			workInProgress = siblingFiber;
			return;
		}

		completedWork = returnFiber as Fiber;
		workInProgress = completedWork;
	} while (completedWork !== null);
}
