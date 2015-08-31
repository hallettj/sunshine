import type { React }            from 'react'
import type { Property, Stream } from 'kefir'
import type * as Sunshine        from 'sunshine-framework'

declare module 'sunshine-framework/react' {
  declare var App: Class<Sunshine.App>;

  declare type AppStateStandin = Object
  declare type Context<AppState> = {
    _sunshineApp: Sunshine.App<AppState>
  }

  declare class Component<DefProps,Props,ComponentState:Object> extends
                                  React.Component<DefProps,Props,ComponentState> {
    context: $Subtype<Context<AppStateStandin>>;
    state:   ComponentState;

    constructor(props: Props, context: Context<AppStateStandin>): void;

    getState(appState: AppStateStandin): ?ComponentState;
    emit<Event: Object>(event: Event): void;
    getChildContext(): Context<AppStateStandin>;
  }
}
