import { defineToolcraft } from "@/toolcraft/runtime";

export const appSchema = defineToolcraft({
  canvas: {
    enabled: true,
    draggable: true,
    renderScale: true,
    size: { width: 1920, height: 1080, unit: "px" },
    sizing: { mode: "editable-output" },
    upload: true,
  },
  panels: {
    controls: {
      sections: [
        // ── Background ──
        {
          title: "Background",
          controls: {
            bgInclude: {
              defaultValue: true,
              label: "Include",
              target: "background.include",
              type: "switch",
            },
            bgColor: {
              defaultValue: "#000000",
              label: false,
              target: "background.color",
              type: "color",
            },
          },
          layoutGroups: [
            {
              columns: 2,
              controls: ["bgInclude", "bgColor"],
              layout: "inline",
            },
          ],
        },
        // ── Node Graph ──
        {
          title: "Node Graph",
          controls: {
            showNodeGraph: {
              defaultValue: false,
              label: "Show graph",
              target: "nodeGraph.visible",
              type: "switch",
            },
            nodeGraphZoom: {
              defaultValue: 100,
              label: "Zoom",
              max: 300,
              min: 20,
              orderRole: "detail",
              step: 5,
              target: "nodeGraph.zoom",
              type: "slider",
              unit: "%",
            },
          },
          layoutGroups: [
            {
              columns: 2,
              controls: ["showNodeGraph", "nodeGraphZoom"],
              layout: "inline",
            },
          ],
        },
        // ── Render ──
        {
          title: "Render",
          controls: {
            fps: {
              defaultValue: 30,
              label: "FPS",
              max: 60,
              min: 24,
              step: 1,
              target: "render.fps",
              type: "slider",
              variant: "discrete",
              unit: "fps",
            },
            quality: {
              defaultValue: 90,
              label: "Quality",
              max: 100,
              min: 1,
              step: 1,
              target: "render.quality",
              type: "slider",
              unit: "%",
            },
            resolution: {
              defaultValue: "full",
              label: "Resolution",
              options: [
                { label: "Full", value: "full" },
                { label: "Half", value: "half" },
                { label: "Quarter", value: "quarter" },
              ],
              target: "render.resolution",
              type: "segmented",
            },
          },
        },
        // ── Media ──
        {
          title: "Media",
          controls: {
            addAsset: {
              accept: ".png,.jpg,.jpeg,.gif,.webp,.bmp,.mp4,.webm,.mov,.mp3,.wav,.ogg",
              assetKind: "image",
              label: "Add Asset",
              target: "media.import",
              type: "fileDrop",
            },
          },
        },
        // ── Image Export ──
        {
          title: "Image Export",
          controls: {
            imageFormat: {
              defaultValue: "png",
              label: "Format",
              options: [
                { label: "PNG", value: "png" },
                { label: "JPG", value: "jpg" },
              ],
              target: "export.image.format",
              type: "select",
            },
            imageResolution: {
              defaultValue: "4k",
              label: "Resolution",
              options: [
                { label: "2K", value: "2k" },
                { label: "4K", value: "4k" },
                { label: "8K", value: "8k" },
              ],
              target: "export.image.resolution",
              type: "select",
            },
          },
          layoutGroups: [
            {
              columns: 2,
              controls: ["imageFormat", "imageResolution"],
              layout: "inline",
            },
          ],
        },
        // ── Video Export ──
        {
          title: "Video Export",
          controls: {
            videoFormat: {
              defaultValue: "mp4",
              label: "Format",
              options: [
                { label: "MP4", value: "mp4" },
                { label: "WebM", value: "webm" },
              ],
              target: "export.video.format",
              type: "select",
            },
            videoResolution: {
              defaultValue: "current",
              label: "Resolution",
              options: [
                { label: "Current", value: "current" },
                { label: "4K", value: "4k" },
              ],
              target: "export.video.resolution",
              type: "select",
            },
          },
          layoutGroups: [
            {
              columns: 2,
              controls: ["videoFormat", "videoResolution"],
              layout: "inline",
            },
          ],
        },
        // ── Export actions (sticky footer) ──
        {
          title: "Export",
          actionGroup: "secondary",
          controls: {
            exportActions: {
              label: "Export",
              target: "export.actions",
              type: "panelActions",
              actions: [
                {
                  label: "Export Video",
                  value: "export.video",
                  variant: "default",
                  icon: "upload-simple",
                },
                {
                  label: "Export PNG",
                  value: "export.png",
                  variant: "outline",
                  icon: "upload-simple",
                },
              ],
            },
          },
        },
      ],
      title: "ARC Editor",
    },
    timeline: {
      enabled: true,
      mode: "keyframes",
      defaultDurationSeconds: 12,
    },
  },
  toolbar: {
    history: true,
    radar: true,
    zoom: true,
    theme: false,
  },
  export: {
    png: {
      background: "include",
    },
  },
  settingsTransfer: false,
  persistence: {
    storage: "none",
  },
});
