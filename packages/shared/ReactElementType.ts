
export type ReactElement = {
    $$typeof: any,
    type: any,
    key: any,
    ref: any,
    props: any,
    // __DEV__ or for string refs
    _owner: any,
  
    // __DEV__
    _store: {validated: boolean},
  };