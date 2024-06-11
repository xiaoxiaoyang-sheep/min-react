/*
 * @Author: Yanko 904852749@qq.com
 * @Date: 2024-05-09 10:26:49
 * @LastEditors: Yanko 904852749@qq.com
 * @LastEditTime: 2024-06-11 18:53:39
 * @FilePath: /min-react/example/src/main.tsx
 * @Description:
 *
 * Copyright (c) 2024 by Yanko, All Rights Reserved.
 */
import {
	Component,
	ReactDOM,
	useCallback,
	useEffect,
	useLayoutEffect,
	useMemo,
	useReducer,
	useRef,
	useState,
} from "../which-react";
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
				{/* @ts-ignore */}
				<h3>{this.props.name}</h3>
			</div>
		);
	}
}

function FunctionComponent({ name }: { name: string }) {
	const [count1, setCount1] = useReducer((x: any) => x + 1, 0);
	const [count2, setCount2] = useState(0);
	// const arr = count1 % 2 === 0 ? [0, 1, 2, 3, 4] : [0, 1, 2, 3];
	// const arr = count1 % 2 === 0 ? [0, 1, 2, 3, 4] : [0, 1, 2, 4];
	const arr = count1 % 2 === 0 ? [0, 1, 2, 3, 4] : [3, 2, 0, 4, 1];

	const addCount = useCallback(() => {
		let sum = 0;
		for (let i = 0; i < count1 * 100; i++) {
			sum += i;
		}
		return sum;
	}, [count1]);

	const ref = useRef(0);

	const handleClick = () => {
		ref.current += 1;
		alert(" You clicked " + ref.current + " times");
	};

	useLayoutEffect(() => {
		console.log("useLayoutEffect");
	}, [count1]);

	useEffect(() => {
		console.log("useEffect");
	}, [count2]);

	return (
		<div className="border">
			<h3>{name}</h3>

			<button
				onClick={() => {
					setCount1();
				}}
			>
				{count1}
			</button>
			{/* <ul>
				{arr.map((item) => <li key={"li" + item}>{item}</li>)}
			</ul> */}
			<button
				onClick={() => {
					setCount2(count2 + 1);
				}}
			>
				{count2}
			</button>
		</div>
	);
}

const jsx = (
	<div className="box border">
		<FunctionComponent name="函数组件" />
		{/* @ts-ignore */}
		<ClassComponent name="累组件" />
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
ReactDOM.createRoot(document.getElementById("root") as HTMLElement).render(
	(<FunctionComponent name="函数组件" />) as any
);

// div.root 对应的是根fiber， Fiber， tag = HostRoot = 3

// 原生标签Fiber， tag = HostComponent = 5

// Host
// 1. HostRoot
// 2. HostComponent
// 3. HostText 不能有子节点
