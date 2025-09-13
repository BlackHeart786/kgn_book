/* eslint-disable @next/next/no-img-element */
"use client";

import { useState, useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { useSession } from "next-auth/react";

type CompanyDetails = {
  id: number;
  company_name: string;
  address?: string;
  city?: string;
  state?: string;
  pin_code?: string;
  country?: string;
  phone?: string;
  email?: string;
  gst_no?: string;
  registration_number?: string;
  logo?: string; 
  is_own_company: boolean;
  created_at: string;
  updated_at: string;
};

const CompanyService = {
  async fetchCompany(): Promise<CompanyDetails | null> {
    const response = await fetch("/api/company_details");
    if (response.status === 404) return null;
    if (!response.ok) throw new Error("Failed to fetch company details");
    return response.json();
  },

  async updateCompany(
    data: Partial<CompanyDetails>,
    logoFile?: File
  ): Promise<CompanyDetails> {
    const formData = new FormData();

    Object.entries(data).forEach(([key, value]) => {
      if (value !== undefined && value !== null) {
        formData.append(key, value.toString());
      }
    });

    if (logoFile) {
      formData.append("logo", logoFile);
    }

    const response = await fetch("/api/company_details/update", {
      method: "PUT",
      body: formData,
    });

    if (!response.ok) throw new Error("Failed to update company details");
    return response.json();
  },
};

export default function CompanyPage() {
  const router = useRouter();
  const { data: session, status } = useSession();
  const [isEditing, setIsEditing] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [company, setCompany] = useState<CompanyDetails | null>(null);
  const [formData, setFormData] = useState<Partial<CompanyDetails> | null>(
    null
  );
  const [error, setError] = useState<string | null>(null);
  const [isCompanyFound, setIsCompanyFound] = useState(true);
  const [canCreate, setCanCreate] = useState(false);
  const [sessionLoaded, setSessionLoaded] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [logoFile, setLogoFile] = useState<File | null>(null);
  const [logoPreview, setLogoPreview] = useState<string | null>(null);

  const loadCompanyData = async () => {
    try {
      setIsLoading(true);
      const data = await CompanyService.fetchCompany();
      if (data) {
        setCompany(data);
        setFormData(data);
        setIsCompanyFound(true);
        setError(null);
      } else {
        setCompany(null);
        setFormData({
          company_name: "",
          is_own_company: false,
        });
        setIsCompanyFound(false);
      }
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "Failed to load company data"
      );
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    const fetchPermissions = async () => {
      if (status !== "authenticated") {
        setSessionLoaded(true);
        loadCompanyData();
        return;
      }
      try {
        const res = await fetch("/api/freshPermissions");
        if (!res.ok) throw new Error("Failed to fetch permissions");
        const data = await res.json();
        setCanCreate(
          data.is_ceo || data.permissions?.includes("edit_company_details")
        );
        setSessionLoaded(true);
      } catch (err) {
        setError(
          err instanceof Error ? err.message : "Failed to load permissions"
        );
      }
    };

    fetchPermissions();
    loadCompanyData();
  }, [status]);

  useEffect(() => {
    return () => {
      if (logoPreview) {
        URL.revokeObjectURL(logoPreview);
      }
    };
  }, [logoPreview]);

  const handleInputChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>
  ) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      setLogoFile(file);
      const previewUrl = URL.createObjectURL(file);
      setLogoPreview(previewUrl);
    }
  };

  const triggerFileInput = () => {
    fileInputRef.current?.click();
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData) return;

    try {
      setIsLoading(true);
      const updatedCompany = await CompanyService.updateCompany(
        formData,
        logoFile
      );
      setCompany(updatedCompany);
      setFormData(updatedCompany);
      setLogoFile(null);
      setLogoPreview(null);
      setIsEditing(false);
      setError(null);
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "Failed to update company details"
      );
    } finally {
      setIsLoading(false);
    }
  };

  if (isLoading || !sessionLoaded) {
    return (
      <div className="flex-1 flex flex-col p-8 overflow-auto bg-[#1C1C1D] items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
        <p className="mt-4 text-gray-300">Loading company details...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex-1 flex flex-col p-8 overflow-auto bg-[#1C1C1D] items-center justify-center">
        <div className="text-red-500 mb-4">Error: {error}</div>
        <button
          onClick={() => window.location.reload()}
          className="bg-blue-600 hover:bg-blue-700 text-white py-2 px-4 rounded-md"
        >
          Retry
        </button>
      </div>
    );
  }

  if (!isCompanyFound) {
    return (
      <div className="flex-1 flex flex-col p-8 overflow-auto bg-[#1C1C1D] items-center justify-center text-center">
        <div className="text-gray-300 mb-6 text-xl font-medium">
          No company details found.
        </div>
        <p className="text-green-400 mb-8">
          It looks like you haven&apos;t added your company information yet.
        </p>
        {canCreate && (
          <Link href="/company_details/create">
            <div className="bg-blue-600 hover:bg-blue-700 text-white py-3 px-8 rounded-lg text-lg font-semibold">
              Create Company Details
            </div>
          </Link>
        )}
      </div>
    );
  }

  if (!isEditing) {
    if (!company) return null;

    return (
      <div className="flex-1 flex flex-col p-8 overflow-auto bg-[#1C1C1D]">
        <div className="flex justify-between items-center mb-6">
          <h1 className="text-2xl font-semibold text-gray-300">
            Company Details
          </h1>
          {canCreate && (
            <button
              onClick={() => setIsEditing(true)}
              className="bg-blue-600 hover:bg-blue-700 text-white py-2 px-4 rounded-md"
              disabled={isLoading}
            >
              Edit
            </button>
          )}
        </div>

        <div className="overflow-x-auto bg-[#2D2E30] rounded-lg shadow-md p-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            <div className="space-y-6">
              {company.logo && (
                <div className="mb-4">
                  <img
                    src={company.logo}
                    alt="Company logo"
                    className="h-40 w-auto object-contain"
                  />
                </div>
              )}

              <div className="text-white-300">
                <h2 className="text-lg font-medium mb-3 text-gray-100">
                  Basic Information
                </h2>
                <div className="space-y-2">
                  <p>
                    <span className="font-medium text-green-400">
                      Company Name:{" "}
                    </span>
                    <span className="text-yellow-500">
                      {company.company_name}
                    </span>
                  </p>
                  <p>
                    <span className="font-medium text-green-400">
                      Own Company:{" "}
                    </span>
                    <span className="text-yellow-500">
                      {company.is_own_company ? "Yes" : "No"}
                    </span>
                  </p>
                </div>
              </div>

              <div className="text-gray-300">
                <h2 className="text-lg font-medium mb-3 text-gray-100">
                  Legal Information
                </h2>
                <div className="space-y-2">
                  {company.gst_no && (
                    <p>
                      <span className="font-medium text-green-400">GST: </span>
                      <span className="text-yellow-500">{company.gst_no}</span>
                    </p>
                  )}
                  {company.registration_number && (
                    <p>
                      <span className="font-medium text-green-400">
                        Registration:{" "}
                      </span>
                      <span className="text-yellow-500">
                        {company.registration_number}
                      </span>
                    </p>
                  )}
                </div>
              </div>
            </div>

            <div className="space-y-6 text-gray-300">
              <div>
                <h2 className="text-lg font-medium mb-3 text-gray-100">
                  Address
                </h2>
                {company.address && (
                  <p className="mb-2 text-yellow-500">{company.address}</p>
                )}
                <p className="text-yellow-500">
                  {[
                    company.city,
                    company.state,
                    company.pin_code,
                    company.country,
                  ]
                    .filter(Boolean)
                    .join(", ")}
                </p>
              </div>

              <div>
                <h2 className="text-lg font-medium mb-3 text-gray-100">
                  Contact
                </h2>
                {company.phone && (
                  <p>
                    <span className="font-medium text-green-400">Phone: </span>
                    <span className="text-yellow-500">{company.phone}</span>
                  </p>
                )}
                {company.email && (
                  <p>
                    <span className="font-medium text-green-400">Email: </span>
                    <span className="text-yellow-500">{company.email}</span>
                  </p>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (!formData) return null;

  return (
    <div className="flex-1 flex flex-col p-8 overflow-auto bg-[#1C1C1D]">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-semibold text-gray-300">
          Edit Company Details
        </h1>
        <div className="flex space-x-3">
          <button
            type="button"
            onClick={() => setIsEditing(false)}
            className="bg-gray-600 hover:bg-gray-700 text-white py-2 px-4 rounded-md"
            disabled={isLoading}
          >
            Cancel
          </button>
          <button
            type="submit"
            onClick={handleSubmit}
            className="bg-blue-600 hover:bg-blue-700 text-white py-2 px-4 rounded-md"
            disabled={isLoading}
          >
            {isLoading ? "Saving..." : "Save"}
          </button>
        </div>
      </div>

      {error && (
        <div className="mb-4 p-4 bg-red-900/30 border border-red-700 rounded-md text-red-300">
          {error}
        </div>
      )}

      <form className="overflow-x-auto bg-[#2D2E30] rounded-lg shadow-md p-6">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium mb-2 text-gray-300">
                Company Logo
              </label>
              <input
                type="file"
                ref={fileInputRef}
                onChange={handleFileChange}
                accept="image/*"
                className="hidden"
              />

              <div className="flex items-center space-x-4">
                {logoPreview || company.logo ? (
                  <div className="relative">
                    <img
                      src={logoPreview || company.logo}
                      alt="Logo preview"
                      className="w-16 h-16 rounded-md object-cover"
                    />
                    <button
                      type="button"
                      onClick={() => {
                        setLogoFile(null);
                        setLogoPreview(null);
                        if (fileInputRef.current)
                          fileInputRef.current.value = "";
                      }}
                      className="absolute -top-2 -right-2 bg-red-500 text-white rounded-full w-5 h-5 flex items-center justify-center text-xs"
                    >
                      ×
                    </button>
                  </div>
                ) : (
                  <div className="w-16 h-16 rounded-md bg-[#1C1C1D] border border-gray-600 flex items-center justify-center">
                    <span className="text-green-400 text-xs">No logo</span>
                  </div>
                )}

                <button
                  type="button"
                  onClick={triggerFileInput}
                  className="bg-gray-600 hover:bg-gray-700 text-white py-2 px-4 rounded-md text-sm"
                  disabled={isLoading}
                >
                  {logoFile ? "Change Logo" : "Upload Logo"}
                </button>
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium mb-2 text-gray-300">
                Company Name *
              </label>
              <input
                type="text"
                name="company_name"
                value={formData.company_name || ""}
                onChange={handleInputChange}
                required
                className="w-full p-2 rounded-md bg-[#1C1C1D] border border-gray-600 text-gray-300"
                disabled={isLoading}
              />
            </div>

            <div>
              <label className="block text-sm font-medium mb-2 text-gray-300">
                Address
              </label>
              <textarea
                name="address"
                value={formData.address || ""}
                onChange={handleInputChange}
                rows={3}
                className="w-full p-2 rounded-md bg-[#1C1C1D] border border-gray-600 text-gray-300"
                disabled={isLoading}
              />
            </div>
          </div>

          <div className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium mb-2 text-gray-300">
                  Email
                </label>
                <input
                  type="email"
                  name="email"
                  value={formData.email || ""}
                  onChange={handleInputChange}
                  className="w-full p-2 rounded-md bg-[#1C1C1D] border border-gray-600 text-gray-300"
                  disabled={isLoading}
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-2 text-gray-300">
                  Phone
                </label>
                <input
                  type="tel"
                  name="phone"
                  value={formData.phone || ""}
                  onChange={handleInputChange}
                  className="w-full p-2 rounded-md bg-[#1C1C1D] border border-gray-600 text-gray-300"
                  disabled={isLoading}
                />
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium mb-2 text-gray-300">
                  GST Number
                </label>
                <input
                  type="text"
                  name="gst_no"
                  value={formData.gst_no || ""}
                  onChange={handleInputChange}
                  className="w-full p-2 rounded-md bg-[#1C1C1D] border border-gray-600 text-gray-300"
                  disabled={isLoading}
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-2 text-gray-300">
                  Registration Number
                </label>
                <input
                  type="text"
                  name="registration_number"
                  value={formData.registration_number || ""}
                  onChange={handleInputChange}
                  className="w-full p-2 rounded-md bg-[#1C1C1D] border border-gray-600 text-gray-300"
                  disabled={isLoading}
                />
              </div>
            </div>

            <div className="flex items-center mt-4">
              <span className="text-sm font-medium text-gray-300 mr-2">
                This is our own company:
              </span>
              <span className="text-green-400">
                {formData.is_own_company ? "Yes" : "No"}
              </span>
            </div>
          </div>
        </div>
      </form>
    </div>
  );
}
