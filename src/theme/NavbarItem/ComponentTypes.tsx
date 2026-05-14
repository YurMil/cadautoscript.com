import ComponentTypes from '@theme-original/NavbarItem/ComponentTypes';
import CustomSearchNavbarItem from '@site/src/theme/NavbarItem/CustomSearch';
import NavbarAuthNavbarItem from '@site/src/theme/NavbarItem/NavbarAuth';
import SupportButtonNavbarItem from '@site/src/theme/NavbarItem/SupportButton';
import ThemeToggleNavbarItem from '@site/src/theme/NavbarItem/ThemeToggle';
import LanguageSwitcherNavbarItem from '@site/src/theme/NavbarItem/LanguageSwitcher';

export default {
  ...ComponentTypes,
  'custom-search': CustomSearchNavbarItem,
  'custom-navbar-auth': NavbarAuthNavbarItem,
  'custom-support-button': SupportButtonNavbarItem,
  'custom-theme-toggle': ThemeToggleNavbarItem,
  'custom-language-switcher': LanguageSwitcherNavbarItem,
};
