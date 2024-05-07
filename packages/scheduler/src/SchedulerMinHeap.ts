

export type Heap<T extends Node> = Array<T>;
export type Node = {
    id: number; // 任务的唯一标识
    sortIndex: number; // 排序的依据
};


// ! 获取堆顶元素
export function peek<T extends Node>(heap: Heap<T>): T | null {
    return heap.length === 0 ? null : heap[0];
}

// ! 给堆添加元素
export function push<T extends Node>(heap: Heap<T>, node: T): void {
    // 1. 把node放到堆最后
    const index = heap.length;
    heap.push(node);
    // 2. 调整最小堆，从下往上堆化
    siftUp(heap, node, index);
}

function siftUp<T extends Node>(heap: Heap<T>, node: T, i: number): void {
    let index = i;
    while(index > 0) {
        const parentIndex = (index - 1) >>> 1;
        const parent = heap[parentIndex];
        if(compare(parent, node) > 0) {
            // 子节点更小，与父节点交换
            heap[parentIndex] = node;
            heap[index] = parent;
            index = parentIndex;
        } else {
            return
        }
    }
}

// ! 删除堆顶元素
export function pop<T extends Node>(heap: Heap<T>): T | null {
    if(heap.length === 0) { return null;}

    const first = heap[0];
    const last = heap.pop()!;
    if(first !== last) {
        heap[0] = last;
        siftDown(heap, last, 0);
    }

    return first
}

function siftDown<T extends Node>(heap: Heap<T>, node: T, i: number): void {
    let index = i;
    const length = heap.length;
    const halfLength = length >>> 1;
    while(index < halfLength) {
        const leftIndex = (index + 1) * 2 - 1;
        const left = heap[leftIndex];
        const rightIndex = leftIndex + 1;
        const right = heap[rightIndex]; // right不一定存在，还需要判断是否存在
        if(compare(left, node) < 0) {
            // left < node
            if(rightIndex < length && compare(right, left) < 0) {
                // righ存在，且right < left
                heap[rightIndex] = node;
                heap[index] = right;
                index = rightIndex;
            } else {
                // left更小或者right不存在
                heap[leftIndex] = node;
                heap[index] = left;
                index = leftIndex;
            }
        } else if (rightIndex < length && compare(right, node) < 0) {
            // left >= node && right < node
            heap[index] = right;
            heap[rightIndex] = node;
            index = rightIndex;
        } else {
            // 根节点最小，不需要调整
            return;
        }
    }
}


function compare(a: Node, b: Node) {
    const diff = a.sortIndex - b.sortIndex
    return diff !== 0 ? diff : a.id - b.id
}