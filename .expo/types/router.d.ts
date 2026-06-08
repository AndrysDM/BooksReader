/* eslint-disable */
import * as Router from 'expo-router';

export * from 'expo-router';

declare module 'expo-router' {
  export namespace ExpoRouter {
    export interface __routes<T extends string | object = string> {
      hrefInputParams: { pathname: Router.RelativePathString, params?: Router.UnknownInputParams } | { pathname: Router.ExternalPathString, params?: Router.UnknownInputParams } | { pathname: `/../components/reader/BookmarksModal`; params?: Router.UnknownInputParams; } | { pathname: `/_sitemap`; params?: Router.UnknownInputParams; } | { pathname: `/home`; params?: Router.UnknownInputParams; } | { pathname: `/reader`; params?: Router.UnknownInputParams; };
      hrefOutputParams: { pathname: Router.RelativePathString, params?: Router.UnknownOutputParams } | { pathname: Router.ExternalPathString, params?: Router.UnknownOutputParams } | { pathname: `/../components/reader/BookmarksModal`; params?: Router.UnknownOutputParams; } | { pathname: `/_sitemap`; params?: Router.UnknownOutputParams; } | { pathname: `/home`; params?: Router.UnknownOutputParams; } | { pathname: `/reader`; params?: Router.UnknownOutputParams; };
      href: Router.RelativePathString | Router.ExternalPathString | `/../components/reader/BookmarksModal${`?${string}` | `#${string}` | ''}` | `/_sitemap${`?${string}` | `#${string}` | ''}` | `/home${`?${string}` | `#${string}` | ''}` | `/reader${`?${string}` | `#${string}` | ''}` | { pathname: Router.RelativePathString, params?: Router.UnknownInputParams } | { pathname: Router.ExternalPathString, params?: Router.UnknownInputParams } | { pathname: `/../components/reader/BookmarksModal`; params?: Router.UnknownInputParams; } | { pathname: `/_sitemap`; params?: Router.UnknownInputParams; } | { pathname: `/home`; params?: Router.UnknownInputParams; } | { pathname: `/reader`; params?: Router.UnknownInputParams; };
    }
  }
}
