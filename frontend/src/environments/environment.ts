export const environment = {
  /**
   * Empty means same-origin: the browser calls /api/... on whatever host served
   * the page. nginx already proxies /api/ to the backend in every deployment,
   * and `ng serve` does the same through proxy.conf.json.
   *
   * This replaces a pair of environment files that were wired backwards — every
   * import resolved to the production config, and the production build replaced
   * a development file that nothing imported, so `ng serve` talked to the live
   * API.
   */
  API_URL: ''
}
