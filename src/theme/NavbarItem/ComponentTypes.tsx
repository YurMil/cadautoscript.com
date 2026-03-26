import ComponentTypes from '@theme-original/NavbarItem/ComponentTypes';
import CustomSearchNavbarItem from '@site/src/theme/NavbarItem/CustomSearch';
import NavbarAuthNavbarItem from '@site/src/theme/NavbarItem/NavbarAuth';
import SupportButtonNavbarItem from '@site/src/theme/NavbarItem/SupportButton';

export default {
  ...ComponentTypes,
  'custom-search': CustomSearchNavbarItem,
  'custom-navbar-auth': NavbarAuthNavbarItem,
  'custom-support-button': SupportButtonNavbarItem,
};
