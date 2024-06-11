/*
 * @Author: Yanko 904852749@qq.com
 * @Date: 2024-05-09 10:54:14
 * @LastEditors: Yanko 904852749@qq.com
 * @LastEditTime: 2024-06-11 19:02:37
 * @FilePath: /min-react/packages/react-reconciler/src/ReactFiberFlags.ts
 * @Description: 
 * 
 * Copyright (c) 2024 by Yanko, All Rights Reserved. 
 */


export type Flags = number;

export const NoFlags = /*                      */ 0b0000000000000000000000000000;
export const PerformedWork = /*                */ 0b0000000000000000000000000001;
export const Placement = /*                    */ 0b0000000000000000000000000010;
export const Update = /*                       */ 0b0000000000000000000000000100;
export const ChildDeletion = /*                */ 0b0000000000000000000000010000;
export const Passive = /*                      */ 0b0000000000000000100000000000; // 2048