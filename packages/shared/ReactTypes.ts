import { ReactElement } from "./ReactElementType";

export type Source = {
    fileName: string;
    lineNumber: number;
  };
  
  
  export type ReactNode = ReactElement | ReactText | ReactFragment;
  // | ReactPortal
  // | ReactProvider<any>
  // | ReactConsumer<any>;
  
  export type ReactEmpty = null | void | boolean;
  
  export type ReactFragment = ReactEmpty | Iterable<ReactNode>;
  
  export type ReactNodeList = ReactEmpty | ReactNode;
  
  export type ReactText = string | number;
  
  export type ReactContext<T> = {
    $$typeof: symbol | number;
    _currentValue: T;
  
    Provider: ReactProviderType<T>;
    Consumer: ReactContext<T>;
  };
  
  export type ReactProviderType<T> = {
    $$typeof: symbol | number;
    _context: ReactContext<T>;
  };
  