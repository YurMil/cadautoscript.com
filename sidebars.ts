import type {SidebarsConfig} from '@docusaurus/plugin-content-docs';

// This runs in Node.js - Don't use client-side code here (browser APIs, JSX...)

// Utility docs are grouped by the same categories as src/data/utilities.ts
// (issue #61) so the sidebar mirrors the homepage catalog.
const sidebars: SidebarsConfig = {
  tutorialSidebar: [
    'intro',
    {
      type: 'category',
      label: 'Utilities',
      collapsed: false,
      items: [
        'utilities/overview',
        'utilities/engineering-web',
        'utilities/embed-calculators',
        {
          type: 'category',
          label: 'Calculators',
          collapsed: true,
          items: [
            'utilities/cylindrical-shell-rolling',
            'utilities/metal-bending',
            'utilities/pressure-vessel-dished-end-calc',
            'utilities/blind-flange-calculator',
            'utilities/tube-sheet-generator',
            'utilities/gear-pair-calculator',
            'utilities/busbar-calculator',
          ],
        },
        {
          type: 'category',
          label: 'Configurators',
          collapsed: true,
          items: [
            'utilities/bourdon-gauge-configurator',
            'utilities/industrial-thermometer-configurator',
            'utilities/magnetic-level-gauge-configurator',
          ],
        },
        {
          type: 'category',
          label: 'PDF Tools',
          collapsed: true,
          items: [
            'utilities/pdf-master',
            'utilities/pdf-batch-signer',
            'utilities/pdf-bom-extractor',
            'utilities/pdf-number-extractor',
          ],
        },
        {
          type: 'category',
          label: 'CAD & 3D',
          collapsed: true,
          items: [
            'utilities/pipe-cutter',
            'utilities/dxf-editor',
            'utilities/webstep-viewer',
            'utilities/qr-nameplate',
          ],
        },
        {
          type: 'category',
          label: 'Productivity',
          collapsed: true,
          items: [
            'utilities/interactive-thread',
            'utilities/qr-master',
            'utilities/file-renamer',
            'utilities/folder-structure-builder',
            'utilities/engineering-prompt-catalog',
            'utilities/business-calendar-generator',
            'utilities/react-table-editor',
            'utilities/focus-planner',
            'utilities/wikalog-analyzer',
          ],
        },
      ],
    },
  ],
};

export default sidebars;
