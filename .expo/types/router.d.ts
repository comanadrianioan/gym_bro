/* eslint-disable */
import * as Router from 'expo-router';

export * from 'expo-router';

declare module 'expo-router' {
  export namespace ExpoRouter {
    export interface __routes<T extends string = string> extends Record<string, unknown> {
      StaticRoutes: `/` | `/(auth)` | `/(auth)/login` | `/(tabs)` | `/(tabs)/` | `/(tabs)/library` | `/(tabs)/progress` | `/(tabs)/settings` | `/_sitemap` | `/library` | `/login` | `/progress` | `/settings`;
      DynamicRoutes: `/workout/${Router.SingleRoutePart<T>}`;
      DynamicRouteTemplate: `/workout/[id]`;
    }
  }
}
