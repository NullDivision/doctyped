// flow-typed signature: 5bb255f59a6a303142d39d0faf7b5a21
// flow-typed version: <<STUB>>/request-promise-native_v1.0.5/flow_v0.90.0

/**
 * This is an autogenerated libdef stub for:
 *
 *   'request-promise-native'
 *
 * Fill this stub out by replacing all the `any` types.
 *
 * Once filled out, we encourage you to share your work with the
 * community by sending a pull request to:
 * https://github.com/flowtype/flow-typed
 */

type RequestOptions = {|
  body?: Object,
  headers?: Object,
  json?: boolean,
  method: 'POST' | 'PUT' | 'PATCH' | 'GET' | 'DELETE',
  rejectUnauthorized: boolean,
  uri: string
|};

declare module 'request-promise-native' {

  declare module.exports: (RequestOptions) => Promise<any>;
}

/**
 * We include stubs for each file inside this npm package in case you need to
 * require those files directly. Feel free to delete any files that aren't
 * needed.
 */
declare module 'request-promise-native/errors' {
  declare module.exports: any;
}

declare module 'request-promise-native/lib/rp' {
  declare module.exports: any;
}

// Filename aliases
declare module 'request-promise-native/errors.js' {
  declare module.exports: $Exports<'request-promise-native/errors'>;
}
declare module 'request-promise-native/lib/rp.js' {
  declare module.exports: $Exports<'request-promise-native/lib/rp'>;
}
