import axios from 'axios';
import Promise from 'bluebird';
import toml from 'toml';
import {Config} from "./config";

// PAYSHARES_TOML_MAX_SIZE is the maximum size of payshares.toml file
export const PAYSHARES_TOML_MAX_SIZE = 100 * 1024;

/**
 * PaysharesTomlResolver allows resolving `payshares.toml` files.
 */
export class PaysharesTomlResolver {
  /**
   * Returns a parsed `payshares.toml` file for a given domain.
   * Returns a `Promise` that resolves to the parsed payshares.toml object. If `payshares.toml` file does not exist for a given domain or is invalid Promise will reject.
   * ```js
   * PaysharesSdk.PaysharesTomlResolver.resolve('acme.com')
   *   .then(paysharesToml => {
   *     // paysharesToml in an object representing domain payshares.toml file.
   *   })
   *   .catch(error => {
   *     // payshares.toml does not exist or is invalid
   *   });
   * ```
   * @see <a href="https://www.payshares.org/developers/learn/concepts/payshares-toml.html" target="_blank">Payshares.toml doc</a>
   * @param {string} domain Domain to get payshares.toml file for
   * @param {object} [opts]
   * @param {boolean} [opts.allowHttp] - Allow connecting to http servers, default: `false`. This must be set to false in production deployments!
   * @returns {Promise}
   */
  static resolve(domain, opts = {}) {
    let allowHttp = Config.isAllowHttp();
    if (typeof opts.allowHttp !== 'undefined') {
        allowHttp = opts.allowHttp;
    }

    let protocol = 'https';
    if (allowHttp) {
        protocol = 'http';
    }
    return axios.get(`${protocol}://${domain}/.well-known/payshares.toml`, {maxContentLength: PAYSHARES_TOML_MAX_SIZE})
      .then(response => {
      	try {
            let tomlObject = toml.parse(response.data);
            return Promise.resolve(tomlObject);
        } catch (e) {
            return Promise.reject(new Error(`Parsing error on line ${e.line}, column ${e.column}: ${e.message}`));
        }
      })
      .catch(err => {
        if (err.message.match(/^maxContentLength size/)) {
          throw new Error(`payshares.toml file exceeds allowed size of ${PAYSHARES_TOML_MAX_SIZE}`);
        } else {
          throw err;
        }
      });
  }
}
