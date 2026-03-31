import UtilityShellPage from '@site/src/components/Utilities/UtilityShellPage';
import PdfNumberExtractor from '@site/src/components/PdfNumberExtractor';
import {utilityPageConfigs} from '@site/src/data/utilityShellPages';

export default function PdfNumberExtractorPage() {
  const config = utilityPageConfigs['pdf-number-extractor'];
  if (!config) {
    throw new Error('Utility page configuration missing for slug "pdf-number-extractor"');
  }

  return <UtilityShellPage {...config} tool={<PdfNumberExtractor />} />;
}
