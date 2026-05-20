import type {SidebarsConfig} from '@docusaurus/plugin-content-docs';

// This runs in Node.js - Don't use client-side code here (browser APIs, JSX...)

/**
 * Creating a sidebar enables you to:
 - create an ordered group of docs
 - render a sidebar for each doc of that group
 - provide next/previous navigation

 The sidebars can be generated from the filesystem, or explicitly defined here.

 Create as many sidebars as you want.
 */
const sidebars: SidebarsConfig = {
  tutorialSidebar: [
    'intro',
    {
      type: 'category',
      label: 'Guides',
      collapsed: false,
      items: [
        'guides/deploy-guide',
        'guides/nodejs-npm-guide',
        'guides/package-json-guide',
      ],
    },
    {
      type: 'category',
      label: 'Utilities',
      collapsed: false,
      items: [
        'utilities/overview',
        'utilities/engineering-web',
        'utilities/embed-calculators',
        'utilities/bourdon-gauge-configurator',
        'utilities/cylindrical-shell-rolling',
        'utilities/pressure-vessel-dished-end-calc',
        'utilities/blind-flange-calculator',
        'utilities/busbar-calculator',
        'utilities/tube-sheet-generator',
        'utilities/webstep-viewer',
        'utilities/engineering-prompt-catalog',
        'utilities/business-calendar-generator',
        'utilities/react-table-editor',
        'utilities/focus-planner',
        'utilities/dxf-editor',
        'utilities/file-renamer',
        'utilities/folder-structure-builder',
        'utilities/industrial-thermometer-configurator',
        'utilities/interactive-thread',
        'utilities/magnetic-level-gauge-configurator',
        'utilities/metal-bending',
        'utilities/pdf-batch-signer',
        'utilities/pdf-bom-extractor',
        'utilities/pdf-master',
        'utilities/pdf-number-extractor',
        'utilities/pipe-cutter',
        'utilities/qr-master',
        'utilities/qr-nameplate',
        'utilities/wikalog-analyzer',
      ],
    },
  ],
};

export default sidebars;
