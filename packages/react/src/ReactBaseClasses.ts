/*
 * @Author: xiaoxiaoyang-sheep 904852749@qq.com
 * @Date: 2024-06-12 20:50:20
 * @LastEditors: xiaoxiaoyang-sheep 904852749@qq.com
 * @LastEditTime: 2024-06-12 20:58:31
 * @FilePath: /min-react/packages/react/src/ReactBaseClasses.ts
 * @Description: 这是默认设置,请设置`customMade`, 打开koroFileHeader查看配置 进行设置: https://github.com/OBKoro1/koro1FileHeader/wiki/%E9%85%8D%E7%BD%AE
 */
export function Component(this: any, props: any, context: any) {
    this.props = props
    this.context = context
}

Component.prototype.isReactComponent = {}