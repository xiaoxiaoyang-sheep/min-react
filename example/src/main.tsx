import { Component, ReactDOM } from "../which-react";
import "./index.css";

let fragment1 = (
	<>
		<>
			<h3>1</h3>
		</>
		<h4>2</h4>
		<>o</>
	</>
);

// fragment1 = (
// 	<Fragment key="sh">
// 		<h3>1</h3>
// 		<h4>2</h4>
// 	</Fragment>
// )

// @ts-ignore
class ClassComponent extends Component {
	render() {
		return (
			<div>
				<h3>ClassComponet</h3>
			</div>
		)
	}
}

const jsx = (
	<div className="box border">
		{/* @ts-ignore */}
		<ClassComponent />
		{fragment1}
		<h1 className="border">omg</h1>
		123123
		<h1>react</h1>
		omg
	</div>
);

// @ts-ignore
// ReactDOM.createRoot(document.getElementById("root") as HTMLElement).render(jsx);
// ReactDOM.createRoot(document.getElementById("root") as HTMLElement).render("omg");
// @ts-ignore
ReactDOM.createRoot(document.getElementById("root") as HTMLElement).render(jsx);

// div.root 对应的是根fiber， Fiber， tag = HostRoot = 3

// 原生标签Fiber， tag = HostComponent = 5

// Host
// 1. HostRoot
// 2. HostComponent
// 3. HostText 不能有子节点
