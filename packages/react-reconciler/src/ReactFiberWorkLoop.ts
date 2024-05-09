import type { Fiber, FiberRoot } from "./ReactInternalTypes";
import { ensureRootIsScheduled } from "./ReactFiberRootScheduler";


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
    // ! 1. render, 构建fiber树VDOM
    // ! 2. commit, VDOM -> DOM
}