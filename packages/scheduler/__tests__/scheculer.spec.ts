import { describe, it, expect, test } from "vitest";
import {
	ImmediatePriority,
	NormalPriority,
	UserBlockingPriority,
	schedukerCallback,
} from "../src/Scheduler";

describe("任务", () => {
	test("2个相同优先级的任务", () => {
		let eventTasks: any[] = [];

		schedukerCallback(NormalPriority, () => {
			eventTasks.push("Task1");

			expect(eventTasks).toEqual(["Task1"]);
		});

		schedukerCallback(NormalPriority, () => {
			eventTasks.push("Task2");

			expect(eventTasks).toEqual(["Task1", "Task2"]);
		});
	});

	test("3个不同优先级的任务", () => {
		let eventTasks: any[] = [];

		schedukerCallback(NormalPriority, () => {
			eventTasks.push("Task1");
			expect(eventTasks).toEqual(["Task3", "Task2", "Task1"]);
		});

		schedukerCallback(UserBlockingPriority, () => {
			eventTasks.push("Task2");
			expect(eventTasks).toEqual(["Task3", "Task2"]);
		});

		schedukerCallback(ImmediatePriority, () => {
			eventTasks.push("Task3");
			expect(eventTasks).toEqual(["Task3"]);
		});
	});

	test("4个不同优先级的任务", () => {
		let eventTasks: any[] = [];

		schedukerCallback(NormalPriority, () => {
			eventTasks.push("Task1");
			expect(eventTasks).toEqual(["Task3", "Task2", "Task1"]);
		});

		schedukerCallback(UserBlockingPriority, () => {
			eventTasks.push("Task2");
			expect(eventTasks).toEqual(["Task3", "Task2"]);
		});

		schedukerCallback(ImmediatePriority, () => {
			eventTasks.push("Task3");
			expect(eventTasks).toEqual(["Task3"]);
		});

		schedukerCallback(NormalPriority, () => {
			eventTasks.push("Task4");
			expect(eventTasks).toEqual(["Task3", "Task2", "Task1", "Task4"]);
		});
	});
});
