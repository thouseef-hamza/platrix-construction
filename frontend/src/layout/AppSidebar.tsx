"use client";
import React, { useEffect, useRef, useState, useCallback } from "react";
import Link from "next/link";
import Image from "next/image";
import { usePathname } from "next/navigation";
import { useSidebar } from "@/context/SidebarContext";
import { useCompany } from "@/context/CompanyContext";
import {
  ChevronDownIcon,
  GridIcon,
  ListIcon,
  PieChartIcon,
  TableIcon,
  UserCircleIcon,
  GroupIcon,
  FileIcon,
  BoxIconLine,
  DollarLineIcon,
  DocsIcon,
  ArrowDownIcon,
  BoltIcon,
} from "@/icons/index";
type NavItem = {
  name: string;
  icon: React.ReactNode;
  path?: string;
  subItems?: { name: string; path: string; pro?: boolean; new?: boolean }[];
};

const navItems: NavItem[] = [
  {
    icon: <BoltIcon />,
    name: "Dashboard",
    path: "/",
  },
  {
    icon: <GridIcon />,
    name: "Projects",
    path: "/projects",
  },
  {
    icon: <GroupIcon />,
    name: "Companies",
    subItems: [
      { name: "Client", path: "/companies/clients" },
      { name: "Supplier", path: "/companies/suppliers" },
      { name: "Subcontracts", path: "/companies/subcontracts" },
    ],
  },
  // {
  //   icon: <FileIcon />,
  //   name: "Contracts",
  //   subItems: [
  //     { name: "Client", path: "/contracts/clients" },
  //     { name: "Subcontracts", path: "/contracts/subcontracts" },
  //   ],
  // },
  {
    icon: <BoxIconLine />,
    name: "Inventory",
    subItems: [{ name: "Materials", path: "/inventory/materials" }],
  },
  {
    icon: <DollarLineIcon />,
    name: "Purchase",
    path: "/purchase",
  },
  {
    icon: <ListIcon />,
    name: "Expense",
    path: "/expense",
  },
  {
    icon: <ArrowDownIcon />,
    name: "Client Invoice",
    path: "/payments",
  },
  {
    icon: <DocsIcon />,
    name: "Subcontractor Invoice",
    path: "/bill",
  },
  {
    icon: <PieChartIcon />,
    name: "Chart of Accounts",
    subItems: [
      { name: "Accounts", path: "/chart-of-accounts/accounts" },
      { name: "Journal Entries", path: "/chart-of-accounts/journal-entries" },
    ],
  },
  {
    icon: <TableIcon />,
    name: "Reports",
    subItems: [
      { name: "Project Profit & Loss", path: "/reports/project-pnl" },
      { name: "Overall P&L", path: "/reports/overall-pnl" },
      { name: "Balance Sheet", path: "/reports/balance-sheet" },
    ],
  },
  {
    icon: <UserCircleIcon />,
    name: "Employee",
    path: "/employee",
  },
];

const AppSidebar: React.FC = () => {
  const { isExpanded, isMobileOpen, isHovered, setIsHovered } = useSidebar();
  const pathname = usePathname();
  const { basePath, path } = useCompany();

  const getFullPath = useCallback(
    (segment: string) =>
      basePath ? path(segment === "/" ? "" : segment) : segment,
    [basePath, path]
  );

  const renderMenuItems = (items: NavItem[], menuType: "main") => (
    <ul className="flex flex-col gap-4">
      {items.map((nav, index) => (
        <li key={nav.name}>
          {nav.subItems ? (
            <button
              onClick={() => handleSubmenuToggle(index, menuType)}
              className={`menu-item group  ${
                openSubmenu?.type === menuType && openSubmenu?.index === index
                  ? "menu-item-active"
                  : "menu-item-inactive"
              } cursor-pointer ${
                !isExpanded && !isHovered
                  ? "lg:justify-center"
                  : "lg:justify-start"
              }`}
            >
              <span
                className={` ${
                  openSubmenu?.type === menuType && openSubmenu?.index === index
                    ? "menu-item-icon-active"
                    : "menu-item-icon-inactive"
                }`}
              >
                {nav.icon}
              </span>
              {(isExpanded || isHovered || isMobileOpen) && (
                <span className={`menu-item-text`}>{nav.name}</span>
              )}
              {(isExpanded || isHovered || isMobileOpen) && (
                <ChevronDownIcon
                  className={`ml-auto w-5 h-5 transition-transform duration-200  ${
                    openSubmenu?.type === menuType &&
                    openSubmenu?.index === index
                      ? "rotate-180 text-brand-500"
                      : ""
                  }`}
                />
              )}
            </button>
          ) : (
            nav.path && (
              <Link
                href={getFullPath(nav.path)}
                className={`menu-item group ${
                  isActive(getFullPath(nav.path)) ? "menu-item-active" : "menu-item-inactive"
                }`}
              >
                <span
                  className={`${
                    isActive(getFullPath(nav.path))
                      ? "menu-item-icon-active"
                      : "menu-item-icon-inactive"
                  }`}
                >
                  {nav.icon}
                </span>
                {(isExpanded || isHovered || isMobileOpen) && (
                  <span className={`menu-item-text`}>{nav.name}</span>
                )}
              </Link>
            )
          )}
          {nav.subItems && (isExpanded || isHovered || isMobileOpen) && (
            <div
              ref={(el) => {
                subMenuRefs.current[`${menuType}-${index}`] = el;
              }}
              className="overflow-hidden transition-all duration-300"
              style={{
                height:
                  openSubmenu?.type === menuType && openSubmenu?.index === index
                    ? `${subMenuHeight[`${menuType}-${index}`]}px`
                    : "0px",
              }}
            >
              <ul className="mt-2 space-y-1 ml-9">
                {nav.subItems.map((subItem) => {
                  const subFullPath = getFullPath(subItem.path);
                  return (
                    <li key={subItem.name}>
                      <Link
                        href={subFullPath}
                        className={`menu-dropdown-item ${
                          isActive(subFullPath)
                            ? "menu-dropdown-item-active"
                            : "menu-dropdown-item-inactive"
                        }`}
                      >
                        {subItem.name}
                        <span className="flex items-center gap-1 ml-auto">
                          {subItem.new && (
                            <span
                              className={`ml-auto ${
                                isActive(subFullPath)
                                  ? "menu-dropdown-badge-active"
                                  : "menu-dropdown-badge-inactive"
                              } menu-dropdown-badge `}
                            >
                              new
                            </span>
                          )}
                          {subItem.pro && (
                            <span
                              className={`ml-auto ${
                                isActive(subFullPath)
                                  ? "menu-dropdown-badge-active"
                                  : "menu-dropdown-badge-inactive"
                              } menu-dropdown-badge `}
                            >
                              pro
                            </span>
                          )}
                        </span>
                      </Link>
                    </li>
                  );
                })}
              </ul>
            </div>
          )}
        </li>
      ))}
    </ul>
  );

  const [openSubmenu, setOpenSubmenu] = useState<{
    type: "main";
    index: number;
  } | null>(null);
  const [subMenuHeight, setSubMenuHeight] = useState<Record<string, number>>(
    {}
  );
  const subMenuRefs = useRef<Record<string, HTMLDivElement | null>>({});

  // const isActive = (path: string) => path === pathname;
   const isActive = useCallback((path: string) => path === pathname, [pathname]);

  useEffect(() => {
    let submenuMatched = false;
    navItems.forEach((nav, index) => {
      if (nav.subItems) {
        nav.subItems.forEach((subItem) => {
          if (isActive(getFullPath(subItem.path))) {
            setOpenSubmenu({ type: "main", index });
            submenuMatched = true;
          }
        });
      }
    });
    if (!submenuMatched) {
      setOpenSubmenu(null);
    }
  }, [pathname, isActive, getFullPath]);

  useEffect(() => {
    // Set the height of the submenu items when the submenu is opened
    if (openSubmenu !== null) {
      const key = `${openSubmenu.type}-${openSubmenu.index}`;
      if (subMenuRefs.current[key]) {
        setSubMenuHeight((prevHeights) => ({
          ...prevHeights,
          [key]: subMenuRefs.current[key]?.scrollHeight || 0,
        }));
      }
    }
  }, [openSubmenu]);

  const handleSubmenuToggle = (index: number, menuType: "main") => {
    setOpenSubmenu((prevOpenSubmenu) => {
      if (
        prevOpenSubmenu &&
        prevOpenSubmenu.type === menuType &&
        prevOpenSubmenu.index === index
      ) {
        return null;
      }
      return { type: menuType, index };
    });
  };

  return (
    <aside
      className={`fixed mt-16 flex flex-col lg:mt-0 top-0 px-5 left-0 bg-white dark:bg-gray-900 dark:border-gray-800 text-gray-900 h-screen transition-all duration-300 ease-in-out z-50 border-r border-gray-200 
        ${
          isExpanded || isMobileOpen
            ? "w-[290px]"
            : isHovered
            ? "w-[290px]"
            : "w-[90px]"
        }
        ${isMobileOpen ? "translate-x-0" : "-translate-x-full"}
        lg:translate-x-0`}
      onMouseEnter={() => !isExpanded && setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      <div
        className={`py-8 flex  ${
          !isExpanded && !isHovered ? "lg:justify-center" : "justify-start"
        }`}
      >
        <Link href={basePath ?? "/"} className="block">
          {(isExpanded || isHovered || isMobileOpen) ? (
            <div className="flex items-center gap-3">
              <Image
                src="/images/logo/blackfox-logo.png"
                alt="Blackfox"
                width={40}
                height={40}
                className="shrink-0 object-contain"
              />
              <div>
                <h1 className="text-lg font-semibold text-gray-900 dark:text-white">
                  Blackfox
                </h1>
                <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">
                  Construction software
                </p>
              </div>
            </div>
          ) : (
            <Image
              src="/images/logo/blackfox-logo.png"
              alt="Blackfox"
              width={36}
              height={36}
              className="shrink-0 object-contain"
              title="Blackfox"
            />
          )}
        </Link>
      </div>
      <div className="flex flex-col overflow-y-auto duration-300 ease-linear no-scrollbar">
        <nav className="mb-6">
          <div className="flex flex-col gap-4">
            <div>
              {renderMenuItems(navItems, "main")}
            </div>
          </div>
        </nav>
      </div>
    </aside>
  );
};

export default AppSidebar;
