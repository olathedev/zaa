import { i as toRequest, n as HTTPError } from "../_libs/h3+rou3+srvx.mjs";
//#region ../../node_modules/.pnpm/nitro@3.0.260429-beta_dotenv@17.4.2_drizzle-orm@0.45.2_postgres@3.4.9__jiti@2.7.0_lru-c_556d57e9b69b7fac1696af3e8bdb2191/node_modules/nitro/dist/runtime/vite.mjs
function fetchViteEnv(viteEnvName, input, init) {
	const viteEnv = (globalThis.__nitro_vite_envs__ || {})[viteEnvName];
	if (!viteEnv) throw HTTPError.status(404);
	return Promise.resolve(viteEnv.fetch(toRequest(input, init)));
}
//#endregion
//#region ../../node_modules/.pnpm/nitro@3.0.260429-beta_dotenv@17.4.2_drizzle-orm@0.45.2_postgres@3.4.9__jiti@2.7.0_lru-c_556d57e9b69b7fac1696af3e8bdb2191/node_modules/nitro/dist/runtime/internal/vite/ssr-renderer.mjs
/** @param {{ req: Request }} HTTPEvent */
function ssrRenderer({ req }) {
	return fetchViteEnv("ssr", req);
}
//#endregion
export { ssrRenderer as default };
