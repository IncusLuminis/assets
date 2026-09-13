export type { MountContext, RendererLifecycle, Viewport } from "./RendererInterface.js";
export { RendererUnsupportedError } from "./RendererUnsupportedError.js";
export { ReservedEngineRenderer } from "./ReservedEngineRenderer.js";
export { VideoRenderer } from "./VideoRenderer.js";
export { StaticRenderer } from "./StaticRenderer.js";
export { GadgetRenderer } from "./GadgetRenderer.js";
// Story #9 -- the real `engine: "svg"` renderer. Not auto-registered
// anywhere (see SvgRenderer.ts's docstring); a consumer/bootstrap calls
// `registry.register("svg", () => new SvgRenderer())` explicitly.
export {
  SvgRenderer,
  DomExternalResourceLoader
} from "./SvgRenderer.js";
export type {
  ResourceTextLoader,
  ThemeScriptHandle,
  ThemeScriptApi,
  LazyResourceKind,
  LazyResourceRequest,
  ExternalResourceLoader,
  SvgRendererOptions
} from "./SvgRenderer.js";
// Story #10 -- the real `engine: "css"` renderer. Likewise not
// auto-registered; call `registry.register("css", () => new CssRenderer())`.
export { CssRenderer } from "./CssRenderer.js";
export type { CssRendererDependencies, CssResourceFetcher, CssIsolationOutcome } from "./CssRenderer.js";
