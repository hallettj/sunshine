declare module kefir {
  declare class KefirObservable<T,E> {

  }

  declare class KefirStream<T,E> {

  }

  declare class KefirProperty<T,E> {
    changes(): KefirStream<T,E>;
  }

  declare class Observable<T> extends KefirObservable<T,any> {}
  declare class Stream<T> extends KefirStream<T,any> {}
  declare class Property<T> extends KefirProperty<T,any> {}

  declare function pool<T,E>(): KefirStream<T,E>;
}
