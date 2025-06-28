
"use client";

import { usePathname } from 'next/navigation';
import React from 'react';
import Head from 'next/head';
import Link from 'next/link';
import {
  MdPeople,
  MdBarChart,
  MdDescription,
  MdUploadFile,
  MdConstruction,
  MdWork,
} from 'react-icons/md';
import { IconType } from 'react-icons';

interface SectionCardProps {
  title: string;
  description: string;
  href: string;
  icon: IconType;
  iconColor?: string;
}

const HomePage: React.FC = () => {
  const pathname = usePathname();
  const isHomePage = pathname === '/';
       if (!isHomePage) return null;

  const sections: SectionCardProps[] = [
    {
      title: 'Vendors',
      description: 'Manage all your vendor information',
      href: '/vendors',
      icon: MdPeople,
      iconColor: 'text-blue-400'
    },
    {
      title: 'Daily Transactions',
      description: 'View and track your daily financial activities',
      href: '/transactions',
      icon: MdBarChart,
      iconColor: 'text-emerald-400'
    },
    {
      title: 'Invoicing',
      description: 'Create, send, and manage all invoices',
      href: '/invoice',
      icon: MdDescription,
      iconColor: 'text-purple-400'
    },
    {
      title: 'Projects',
      description: 'Track the progress of your projects',
      href: '/projects',
      icon:  MdConstruction,

      iconColor: 'text-amber-400'
    },  
    {
      title: 'Document Management',
      description: 'Store documents',
      href: '/documents',
      icon: MdUploadFile,
      iconColor: 'text-cyan-400'
    },
    {
  title: 'Purchase Order',
  description: 'Create and manage purchase orders',
  href: '/PurchaseOrder',
  icon: MdWork,
  iconColor: 'text-pink-400'
},

  ];

  return (
    <div className="relative min-h-screen">
      {/* Background Image - Only on Home Page */}
      <div className="fixed inset-0 -z-10">
        <div 
          className="absolute inset-0 bg-[url('/bg_img/heavy-machinery-used-construction-industry-engineering.jpg')] bg-cover bg-center bg-no-repeat"
          style={{
            backgroundAttachment: 'fixed',
          }}
        />
        {/* Optional overlay to improve text readability */}
        <div className="absolute inset-0 bg-black/30" />
      </div>

      <div className="p-4 sm:p-8 relative"> {/* Added relative positioning */}
        <Head>
          <title>KGN Enterprise | Dashboard</title>
          <meta name="description" content="KGN Enterprise Business Management Dashboard" />
          <link rel="icon" href="/favicon.ico" />
        </Head>

      <main className="max-w-7xl mx-auto">
        <div className="text-center mb-12 pt-8">
          <h1 className="text-3xl sm:text-4xl font-bold text-gray-100 mb-2">
            KGN Enterprise Dashboard
          </h1>
          <p className="text-lg text-gray-300 max-w-2xl mx-auto">
            Centralized management for business operations
          </p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 py-6">
          {sections.map((section, index) => (
            <Link key={index} href={section.href} passHref>
              <div className="
                bg-gray-800/70
                backdrop-blur-sm
                rounded-xl p-6 flex flex-col items-center text-center 
                space-y-4 shadow-lg hover:shadow-2xl 
                transition-all duration-300 hover:scale-[1.02]
                border border-gray-700 hover:border-gray-600
                hover:bg-gray-700/80
                h-full
                cursor-pointer
              ">
                <div className={`p-4 rounded-full bg-gray-700 ${section.iconColor}`}>
                  <section.icon className="text-3xl" />
                </div>
                <h2 className="text-xl font-semibold text-white">{section.title}</h2>
                <p className="text-gray-300 text-sm">{section.description}</p>
               
              </div>
            </Link>
          ))}
        </div>

        
      </main>
    </div>
     </div>
  );
};

export default HomePage;