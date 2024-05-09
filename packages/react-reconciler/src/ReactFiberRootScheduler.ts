import { performConcurrentWorkOnRoot } from "./ReactFiberWorkLoop";
import type { FiberRoot } from "./ReactInternalTypes";
import { NormalPriority, Scheduler } from "scheduler";


export function ensureRootIsScheduled(root: FiberRoot) {
    // 加入微任务队列
    queueMicrotask(() => {
        scheduleTaskForRootDuringMicrotask(root);
    })
}

function scheduleTaskForRootDuringMicrotask(root: FiberRoot) {
    Scheduler.schedukerCallback(NormalPriority, performConcurrentWorkOnRoot.bind(null, root))
}