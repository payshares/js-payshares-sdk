require('es6-promise').polyfill();

// payshares-sdk classes to expose
export * from "./errors";
export {Config} from "./config";
export {Server} from "./server";
export {FederationServer, FEDERATION_RESPONSE_MAX_SIZE} from "./federation_server";
export {PaysharesTomlResolver, PAYSHARES_TOML_MAX_SIZE} from "./payshares_toml_resolver";

// expose classes and functions from payshares-base
export * from "payshares-base";

export default module.exports;
