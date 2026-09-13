import { describe, it, expect } from "vitest";
import {
  VideoRenderer,
  StaticRenderer,
  GadgetRenderer,
  RendererUnsupportedError
} from "../../src/runtime/renderers/index.ts";

// A minimal stand-in DOM element / MountContext -- these renderers must throw
// before touching either, but the lifecycle signatures take them regardless
// (Contract §6.1-§6.2).
const fakeContainer = {};
const fakeContext = {
  theme: "fixture-hud",
  version: "0.1.0",
  variant: "maxi",
  orientation: "landscape",
  manifest: {},
  baseVersion: "1.0.0",
  assetBaseUrl: "https://example.invalid/"
};

const RESERVED = [
  { Renderer: VideoRenderer, name: "VideoRenderer" },
  { Renderer: StaticRenderer, name: "StaticRenderer" },
  { Renderer: GadgetRenderer, name: "GadgetRenderer" }
];

describe("reserved-engine renderer stubs (Contract §5.2, §20.1 RendererUnsupported)", () => {
  for (const { Renderer, name } of RESERVED) {
    describe(name, () => {
      it(`mount() rejects with RendererUnsupportedError ("${name} is reserved and unsupported in Platform 0.1")`, async () => {
        const renderer = new Renderer();
        await expect(renderer.mount(fakeContainer, fakeContext)).rejects.toThrow(
          RendererUnsupportedError
        );
        await expect(renderer.mount(fakeContainer, fakeContext)).rejects.toThrow(
          `${name} is reserved and unsupported in Platform 0.1`
        );
      });

      it("setData() throws RendererUnsupportedError", () => {
        const renderer = new Renderer();
        expect(() => renderer.setData({})).toThrow(RendererUnsupportedError);
      });

      it("resize() throws RendererUnsupportedError", () => {
        const renderer = new Renderer();
        expect(() => renderer.resize({ width: 100, height: 100 })).toThrow(
          RendererUnsupportedError
        );
      });

      it("setVariant() rejects with RendererUnsupportedError", async () => {
        const renderer = new Renderer();
        await expect(renderer.setVariant("mini")).rejects.toThrow(RendererUnsupportedError);
      });

      it("destroy() does NOT throw, even though mount never succeeded (Contract §6.6)", () => {
        const renderer = new Renderer();
        expect(() => renderer.destroy()).not.toThrow();
      });

      it("destroy() is safe to call repeatedly (idempotent, Contract §6.6)", () => {
        const renderer = new Renderer();
        renderer.destroy();
        expect(() => renderer.destroy()).not.toThrow();
      });

      it("the thrown error carries code \"RendererUnsupported\" (Contract §20.1 error code)", () => {
        const renderer = new Renderer();
        try {
          renderer.setData({});
          throw new Error("expected setData() to throw");
        } catch (err) {
          expect(err).toBeInstanceOf(RendererUnsupportedError);
          expect(err.code).toBe("RendererUnsupported");
        }
      });
    });
  }
});
