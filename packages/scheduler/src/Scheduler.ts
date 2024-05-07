// ! 实现一个单线程的任务调度器

import { getCurrentTime, isFn } from "shared/utils";
import {
	PriorityLevel,
	NoPriority,
	ImmediatePriority,
	UserBlockingPriority,
	NormalPriority,
	LowPriority,
	IdlePriority,
} from "./SchedulerPriorities";
import { peek, pop, push } from "./SchedulerMinHeap";
import {
	lowPriorityTimeout,
	maxSigned31BitInt,
	normalPriorityTimeout,
	userBlockingPriorityTimeout,
} from "./SchedulerFeatureFlags";

type Callback = (arg: boolean) => Callback | null | undefined | void;

export type Task = {
	id: number;
	callback: Callback | null;
	priorityLevel: PriorityLevel;
	startTime: number;
	expirationTime: number;
	sortIndex: number;
};

// 任务池，最小堆
const taskQueue: Array<Task> = [];

// 标记task的唯一性
let taskIdCounter = 1;

// 当前任务
let currentTask: Task | null = null;
// 当前任务优先级
let currentPriorityLevel: PriorityLevel = NoPriority;
// 记录时间切片的起始值，时间戳
let startTime = -1;
// 时间切片，是一个时间段
let frameInterval = 5;

// 锁
// 是否有 work 在执行
let isPerformingWork = false;
// 主线程是否在调度
let isHostCallbackScheduled = false;

// 任务调度器的入口函数
function schedukerCallback(priorityLevel: PriorityLevel, callback: Callback) {
	const startTime = getCurrentTime();
	
    // expirationTime 是过期时间，理论上的任务执行时间
	let timeout: number;
	switch (priorityLevel) {
		case ImmediatePriority:
			// 立即超时
			timeout = -1;
			break;
		case UserBlockingPriority:
			timeout = userBlockingPriorityTimeout;
			break;
		case LowPriority:
			timeout = lowPriorityTimeout;
			break;
		case IdlePriority:
            // 用不超时
			timeout = maxSigned31BitInt;
			break;
        case NormalPriority:
        default:
            timeout = normalPriorityTimeout;
            break;
	}
    
    const expirationTime = startTime + timeout;
    const newTask: Task = {
        id: taskIdCounter++,
        startTime,
        expirationTime,
        callback,
        priorityLevel,
        sortIndex: -1
    }

    newTask.sortIndex = expirationTime;
    push(taskQueue, newTask);

    // 主线程没有在调度并且没有正在进行的时间切片
    if(!isHostCallbackScheduled && isPerformingWork) {
        isHostCallbackScheduled = true;
        requestHostCallback();
    }
}

// todo
function requestHostCallback() {

}

// 取消某个任务，由于堆小堆没法直接删除，因此只能初步把task.callback 设置为null
// 调度过程中，当这个任务位于堆顶时，删掉
function cancelCallback() {
	currentTask!.callback = null;
}

// 获取当前正在执行任务的优先级
function getCurrentPriorityLevel(): PriorityLevel {
	return currentPriorityLevel;
}

// 把控制权交换给主线程
function shouldYieldToHost() {
	const timeElapsed = getCurrentTime() - startTime;

	if (timeElapsed < frameInterval) {
		return false;
	}
	return true;
}

// 有很多task，每个task都有一个callback，callback执行完了，就执行下一个task
// 一个work就是一个时间切片内执行的一些task
// 时间切片要循环，就是work要循环（loop）
// 返回为true，表示还有任务没有执行完，需要继续执行
function workLoop(initialTime: number): boolean {
	let currentTime = initialTime;
	currentTask = peek(taskQueue);
	while (currentTask !== null) {
		if (currentTask.expirationTime > currentTime && shouldYieldToHost()) {
			break;
		}

		// 执行任务
		const callback = currentTask.callback;
		if (typeof callback === "function") {
			// 有效的任务
			currentTask.callback = null;
			currentPriorityLevel = currentTask.priorityLevel;
			const didUserCallbackTimeout =
				currentTask.expirationTime <= currentTime;
			const continuationCallback = callback(didUserCallbackTimeout);
			if (typeof continuationCallback === "function") {
				currentTask.callback = continuationCallback;
				return true;
			} else {
				if (currentTask === peek(taskQueue)) {
					pop(taskQueue);
				}
			}
		} else {
			// 无效的任务
			pop(taskQueue);
		}

		currentTask = peek(taskQueue);
	}

	if (currentTask !== null) {
		return true;
	} else {
		return false;
	}
}

// todo 实现一个单线程任务调度器
export {
	NoPriority,
	ImmediatePriority,
	UserBlockingPriority,
	NormalPriority,
	LowPriority,
	IdlePriority,
	schedukerCallback, // 某个任务进入调度器，准备调度
	cancelCallback, // 取消某个任务，由于堆小堆没法直接删除，因此只能初步把task.callback 设置为null
	getCurrentPriorityLevel, // 获取当前正在执行任务的优先级
	shouldYieldToHost as shouldYield, // 把控制权交换给主线程
};
