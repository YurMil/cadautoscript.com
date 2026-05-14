import React from 'react';
import LanguageSwitcher from '@site/src/components/I18n/LanguageSwitcher';

// This is a custom Docusaurus navbar item type registered as 'custom-language-switcher'
export default function NavbarLanguageSwitcher() {
  return <LanguageSwitcher compact />;
}
