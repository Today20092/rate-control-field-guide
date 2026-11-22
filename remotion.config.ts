// Remotion CLI config. Source clips come from `node scripts/make-clips.mjs`, kept apart from the site's public/.
import { Config } from '@remotion/cli/config'

Config.setPublicDir('remotion/public')

// `?raw` imports return the file's text, so the video reads colours straight from the site's token file.
Config.overrideWebpackConfig((config) => ({
  ...config,
  module: {
    ...config.module,
    rules: [
      { resourceQuery: /raw/, type: 'asset/source' },
      ...(config.module?.rules ?? []).map((rule) =>
        rule && typeof rule === 'object' ? { ...rule, resourceQuery: { not: [/raw/] } } : rule,
      ),
    ],
  },
}))
