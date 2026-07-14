import type {MDXComponentsObject} from '@theme/MDXComponents';
import MDXComponents from '@theme-original/MDXComponents';

import ReactionsBar from '@site/src/components/Reactions/ReactionsBar';
import Comments from '@site/src/components/Comments';

export default {
  ...MDXComponents,
  // Provide uppercase alias for code blocks in case MDX emits <Code>
  Code: MDXComponents.code,
  ReactionsBar,
  Comments,
} satisfies MDXComponentsObject;
