import {
	Component,
	ReactDOM,
	createContext,
	useCallback,
	useContext,
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



const CountContext = createContext(100);
const ThemeContext = createContext("red");

function FunctionComponent({ name }: { name: string }) {
	const [count1, setCount1] = useReducer((x: any) => x + 1, 0);
	const [count2, setCount2] = useState(0);

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

			<button
				onClick={() => {
					setCount2(count2 + 1);
				}}
			>
				{count2}
			</button>

			<ThemeContext.Provider value="green">
				<CountContext.Provider value={count1}>
					<CountContext.Provider value={count1 + 1}>
						<Child></Child>
					</CountContext.Provider>
					<Child></Child>
				</CountContext.Provider>
			</ThemeContext.Provider>
			<Child></Child>
		</div>
	);
}

function Child() {
	const count = useContext(CountContext);
	const theme = useContext(ThemeContext)
	return (
		<div>
			<h1>Child</h1>
			<p>第一种消费方式</p>
			<p>{count}</p>

			<p>第二种消费方式</p>
			<CountContext.Consumer>
				{(value) => <p>{value}</p>}
			</CountContext.Consumer>

			<p>第三种消费方式</p>
			<ClassComponent></ClassComponent>
		</div>
	);
}

// @ts-ignore
class ClassComponent extends Component {
	static contextType = CountContext
	render() {
		return (
			<div>
				{/* @ts-ignore */}
				<h3>{this.props.name}</h3>
				<p>{this.context}</p>
			</div>
		);
	}
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
