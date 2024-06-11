/*
 * @Author: Yanko 904852749@qq.com
 * @Date: 2024-06-11 18:56:27
 * @LastEditors: Yanko 904852749@qq.com
 * @LastEditTime: 2024-06-11 18:57:01
 * @FilePath: /min-react/packages/react-reconciler/src/ReactHookEffectTags.ts
 * @Description: 
 * 
 * Copyright (c) 2024 by Yanko, All Rights Reserved. 
 */

export type HookFlags = number;

export const NoFlags = /*   */ 0b0000;
// Represents whether effect should fire.
export const HasEffect = /* */ 0b0001; // 1
// Represents the phase in which the effect (not the clean-up) fires.
export const HookInsertion = /* */ 0b0010; // 2
export const HookLayout = /*    */ 0b0100; // 4
export const HookPassive = /*   */ 0b1000; // 8
