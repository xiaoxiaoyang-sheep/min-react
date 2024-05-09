import { createFiber } from "./ReactFiber";
import { Container, Fiber, FiberRoot } from "./ReactInternalTypes";
import { HostRoot } from "./ReactWorkTags";




export function createFiberRoot(containerInfo: Container): FiberRoot {
    const root: FiberRoot = new (FiberRootNode as any)(containerInfo);
    const uninitializeFiber: Fiber = createFiber(HostRoot, null, null);
    root.current = uninitializeFiber;
    uninitializeFiber.stateNode = root;
    return root;
}

export function FiberRootNode(this: any, containerInfo: Container) {
    this.containerInfo = containerInfo;
    this.current = null;
    this.finishedWork = null;
}