"use client";

import React, { useState, useRef, useEffect } from "react";
import { usePathname } from "next/navigation";
import Link from "next/link";
import { signOut, useSession } from "next-auth/react";
import {
  MdHome,
  MdDescription,
  MdPeople,
  MdMenu,
  MdClose,
} from "react-icons/md";
import { IconType } from "react-icons";
import SuccessScreen from "../SuccessScreen"; // Assuming correct path to SuccessScreen

interface NavLink {
  name: string;
  href: string;
  icon?: IconType;
  isRupeeIcon?: boolean;
}

const navLinks: NavLink[] = [
  { name: "Home", href: "/", icon: MdHome },
  { name: "Invoice", href: "/invoice", icon: MdDescription },
  { name: "Vendors", href: "/vendors", icon: MdPeople },
  { name: "Transaction", href: "/transactions", isRupeeIcon: true },
];

const Navbar: React.FC = () => {
  const pathname = usePathname();
  const { data: session } = useSession();
  const isLoggedIn = !!session?.user?.id;
  const isCEO = session?.user?.is_ceo;

  const getActiveTab = (path: string): string => {
    if (path === "/") return "home";
    if (path.startsWith("/invoice")) return "invoice";
    if (path.startsWith("/vendors")) return "vendors";
    if (path.startsWith("/transaction")) return "transaction";
    return "";
  };

  const activeTab = getActiveTab(pathname ?? "");
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const [showLogoutSuccess, setShowLogoutSuccess] = useState(false);

  const toggleMobileMenu = () => setIsMobileMenuOpen(!isMobileMenuOpen);
  const toggleDropdown = () => setIsDropdownOpen(!isDropdownOpen);

  const handleLogout = async () => {
    setIsDropdownOpen(false); // Close dropdown immediately
    setShowLogoutSuccess(true); // Show success message

    // The SuccessScreen's duration prop will handle hiding it.
    // The signOut will occur after the duration of the SuccessScreen.
    // Make sure the duration in SuccessScreen is consistent with the setTimeout here if you want precise control,
    // or let SuccessScreen handle its own timeout for closing and then call signOut in its onClose.
    setTimeout(() => {
      signOut({ callbackUrl: "/login" }); // Redirects to login page after the success message is shown
    }, 2000); // This should ideally match the duration prop of SuccessScreen
  };

  useEffect(() => {
    const handleOutsideClick = (e: MouseEvent) => {
      if (
        dropdownRef.current &&
        !dropdownRef.current.contains(e.target as Node)
      ) {
        setIsDropdownOpen(false);
      }
    };
    document.addEventListener("mousedown", handleOutsideClick);
    return () => document.removeEventListener("mousedown", handleOutsideClick);
  }, []);

  return (
    <>
      
      {showLogoutSuccess && (
        <SuccessScreen
          title="Logged Out"
          message="You have successfully logged out."
          duration={2500} 
          onClose={() => setShowLogoutSuccess(false)}
          showActionButton={false}
        />
      )}

      <nav className="bg-[#3f5341] p-3 flex items-center justify-between rounded-full max-w-6xl mx-auto mt-4 shadow-lg relative z-50">
        {/* Left Section (Logo + Links) */}
        <div className="flex items-center space-x-6">
          <div className="bg-lime-400 rounded-full p-2 flex items-center justify-center h-12 w-20 ml-1">
            <span className="text-[#2a452d] font-extrabold text-2xl">KGN</span>
          </div>

          <div className="hidden md:flex space-x-4">
            {navLinks.map((link) => (
              <Link
                key={link.name}
                href={link.href}
                className={`px-5 py-2.5 rounded-full font-medium text-lg transition-all duration-200 flex items-center space-x-2
                  ${
                    activeTab === link.name.toLowerCase().replace(/\s/g, "-")
                      ? "bg-white text-[#2a452d] shadow-md transform scale-105"
                      : "text-white hover:bg-[#3b5e3f]"
                  }`}
              >
                {link.isRupeeIcon ? (
                  <span
                    className={`text-xl font-bold ${
                      activeTab === link.name.toLowerCase().replace(/\s/g, "-")
                        ? "text-[#2a452d]"
                        : "text-lime-400"
                    }`}
                  >
                    ₹
                  </span>
                ) : (
                  link.icon && (
                    <link.icon
                      className={`text-xl ${
                        activeTab === link.name.toLowerCase().replace(/\s/g, "-")
                          ? "text-[#2a452d]"
                          : "text-lime-400"
                      }`}
                    />
                  )
                )}
                <span>{link.name}</span>
              </Link>
            ))}
          </div>
        </div>

        {/* Right Section (User / Login) */}
        <div className="flex items-center space-x-3 mr-2">
          {isLoggedIn ? (
            <>
              {isCEO && (
                <Link
                  href="/manage-users"
                  className="bg-yellow-400 text-[#2a452d] font-semibold text-sm px-4 py-2 rounded-full hover:bg-yellow-300 transition-colors duration-200"
                >
                  Manage Users
                </Link>
              )}
              <div className="relative" ref={dropdownRef}>
                <button
                  onClick={toggleDropdown}
                  className="bg-lime-400 text-[#000000] font-semibold px-4 py-2.5 rounded-full hover:bg-lime-300 transition-all duration-200 shadow-md"
                >
                  {session.user.username}
                </button>
                {isDropdownOpen && (
                  <div className="absolute right-0 mt-2 bg-white text-[#2a452d] rounded-md shadow-lg z-40 w-40 overflow-hidden">
                    <Link
                      href="/profile"
                      className="block px-4 py-2 hover:bg-gray-100 transition-all duration-150"
                      onClick={() => setIsDropdownOpen(false)}
                    >
                      Profile
                    </Link>
                    <button
                      onClick={handleLogout}
                      className="w-full text-left px-4 py-2 hover:bg-red-100 text-red-600 transition-all duration-150"
                    >
                      Logout
                    </button>
                  </div>
                )}
              </div>
            </>
          ) : (
            <Link
              href="/login"
              className="bg-lime-400 text-[#2a452d] font-semibold text-lg px-6 py-2.5 rounded-full hover:bg-lime-300 transition-colors duration-200 shadow-md hidden md:block"
            >
              Login
            </Link>
          )}

          {/* Mobile Hamburger Button */}
          <button
            onClick={toggleMobileMenu}
            className="md:hidden text-white p-2 rounded-md hover:bg-[#3b5e3f]"
            aria-label="Toggle navigation menu"
          >
            {isMobileMenuOpen ? (
              <MdClose className="h-7 w-7" />
            ) : (
              <MdMenu className="h-7 w-7" />
            )}
          </button>
        </div>

        {/* Mobile Menu */}
        {isMobileMenuOpen && (
          <div className="md:hidden absolute top-full left-10 right-10 bg-[#2a452d] rounded-b-lg shadow-lg py-5 z-30">
            <div className="flex flex-col items-center space-y-4">
              {navLinks.map((link) => (
                <Link
                  key={link.name}
                  href={link.href}
                  onClick={() => setIsMobileMenuOpen(false)}
                  className={`w-full text-center px-5 py-3 rounded-md font-medium text-lg flex items-center justify-center space-x-2
                    ${
                      activeTab === link.name.toLowerCase().replace(/\s/g, "-")
                        ? "bg-white text-[#2a452d] shadow-md"
                        : "text-white hover:bg-[#3b5e3f]"
                    }`}
                >
                  {link.isRupeeIcon ? (
                    <span
                      className={`text-xl font-bold ${
                        activeTab === link.name.toLowerCase().replace(/\s/g, "-")
                          ? "text-[#2a452d]"
                          : "text-lime-400"
                      }`}
                    >
                      ₹
                    </span>
                  ) : (
                    link.icon && (
                      <link.icon
                        className={`text-xl ${
                          activeTab === link.name.toLowerCase().replace(/\s/g, "-")
                            ? "text-[#2a452d]"
                            : "text-lime-400"
                        }`}
                      />
                    )
                  )}
                  <span>{link.name}</span>
                </Link>
              ))}
            </div>
          </div>
        )}
      </nav>
    </>
  );
};

export default Navbar;