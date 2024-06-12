/*
 * @Author: xiaoxiaoyang-sheep 904852749@qq.com
 * @Date: 2024-06-12 18:52:14
 * @LastEditors: xiaoxiaoyang-sheep 904852749@qq.com
 * @LastEditTime: 2024-06-12 19:00:34
 * @FilePath: /min-react/packages/react-reconciler/src/ReactFiberStack.ts
 * @Description: 这是默认设置,请设置`customMade`, 打开koroFileHeader查看配置 进行设置: https://github.com/OBKoro1/koro1FileHeader/wiki/%E9%85%8D%E7%BD%AE
 */



export type StackCursor<T> = {
    current: T
}

// 栈
const valueStack: Array<any> = [] 
let index = -1


// cursor， 记录栈顶元素  valueStack[index]记录的是上一个栈顶元素
export function createCursor<T>(defaultValue: T): StackCursor<T> {
    return {current: defaultValue}
}

export function push<T>(cursor: StackCursor<T>, value: T): void {
    index++

    valueStack[index] = cursor.current
    cursor.current = value
}

export function pop<T>(cursor: StackCursor<T>): void {
    if(index < 0) {
        return
    }

    cursor.current = valueStack[index]
    valueStack[index] = null
    index--
}