import { ReactDOM } from "../which-react";
import "./index.css";

const jsx = (
    <div className="box border">
        <h1 className="border">omg</h1>
    </div>
);


// @ts-ignore
ReactDOM.createRoot(document.getElementById("root") as HTMLElement).render(jsx);


// div.root 对应的是根fiber， Fiber， tag = HostRoot = 3

// 原生标签Fiber， tag = HostComponent = 5

// Host
// 1. HostRoot
// 2. HostComponent
// 3. HostText 不能有子节点