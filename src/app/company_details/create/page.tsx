"use client";

import { useState, useRef, ChangeEvent, useEffect } from "react";
import { useRouter } from "next/navigation";

type CompanyDetails = {
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
  logo_file?: File | null; // Changed from logo_url to handle File object
  logo_preview?: string; // For displaying preview
  is_own_company: boolean;
};

export default function CreateCompanyPage() {
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [formData, setFormData] = useState<CompanyDetails>({
    company_name: "",
    is_own_company: true,
  });

  const handleInputChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>
  ) => {
    const { name, value, type } = e.target;
    const checked = (e.target as HTMLInputElement).checked;

    setFormData((prev) => ({
      ...prev,
      [name]: type === "checkbox" ? checked : value,
    }));
  };

  const handleFileChange = (e: ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];

      // Add file size validation (e.g., 5MB limit)
      if (file.size > 5 * 1024 * 1024) {
        setError("File size should be less than 5MB");
        return;
      }

      // Create preview URL
      const previewUrl = URL.createObjectURL(file);

      setFormData((prev) => ({
        ...prev,
        logo_file: file,
        logo_preview: previewUrl,
      }));
    }
  };
  useEffect(() => {
    return () => {
      if (formData.logo_preview) {
        URL.revokeObjectURL(formData.logo_preview);
      }
    };
  }, [formData.logo_preview]);
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    try {
      setIsLoading(true);
      setError(null);

      // Create FormData for file upload
      const formDataToSend = new FormData();

      // Append all form fields
      Object.entries(formData).forEach(([key, value]) => {
        if (key === "logo_file" && value) {
          formDataToSend.append("logo", value as File);
        } else if (
          key !== "logo_preview" &&
          value !== undefined &&
          value !== null
        ) {
          formDataToSend.append(key, value.toString());
        }
      });

      const response = await fetch("/api/company_details/create", {
        method: "POST",
        body: formDataToSend, // No Content-Type header needed for FormData
      });

      if (!response.ok) {
        throw new Error("Failed to create company");
      }

      router.push("/company_details");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to create company");
    } finally {
      setIsLoading(false);
    }
  };

  const triggerFileInput = () => {
    fileInputRef.current?.click();
  };

  return (
    <div className="flex-1 flex flex-col p-8 overflow-auto bg-[#1C1C1D]">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-semibold text-gray-300">
          Create Company Profile
        </h1>
        <button
          onClick={() => router.back()}
          className="bg-gray-600 hover:bg-gray-700 text-white py-2 px-4 rounded-md"
          disabled={isLoading}
        >
          Back
        </button>
      </div>

      {error && (
        <div className="mb-4 p-4 bg-red-900/30 border border-red-700 rounded-md text-red-300">
          {error}
        </div>
      )}

      <form
        onSubmit={handleSubmit}
        className="overflow-x-auto bg-[#2D2E30] rounded-lg shadow-md p-6"
      >
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium mb-2 text-gray-300">
                Company Logo
              </label>

              {/* Hidden file input */}
              <input
                type="file"
                ref={fileInputRef}
                onChange={handleFileChange}
                accept="image/jpeg,image/png,image/svg+xml" // Explicit accept
                className="hidden"
              />

              {/* Logo preview and upload button */}
              <div className="flex items-center space-x-4">
                {formData.logo_preview ? (
                  <div className="relative">
                    <img
                      src={formData.logo_preview}
                      alt="Logo preview"
                      className="w-16 h-16 rounded-md object-cover"
                    />
                    <button
                      type="button"
                      onClick={() => {
                        setFormData((prev) => ({
                          ...prev,
                          logo_file: null,
                          logo_preview: "",
                        }));
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
                    <span className="text-gray-400 text-xs">No logo</span>
                  </div>
                )}

                <button
                  type="button"
                  onClick={triggerFileInput}
                  className="bg-gray-600 hover:bg-gray-700 text-white py-2 px-4 rounded-md text-sm"
                  disabled={isLoading}
                >
                  {formData.logo_file ? "Change Logo" : "Upload Logo"}
                </button>
              </div>

              <p className="mt-2 text-xs text-gray-400">
                Recommended size: 200x200px (JPG, PNG, SVG)
              </p>
            </div>

            <div>
              <label className="block text-sm font-medium mb-2 text-gray-300">
                Company Name *
              </label>
              <input
                type="text"
                name="company_name"
                value={formData.company_name}
                onChange={handleInputChange}
                required
                className="w-full p-2 rounded-md bg-[#1C1C1D] border border-gray-600 text-gray-300"
                disabled={isLoading}
                placeholder="Enter company name"
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
                placeholder="Enter full address"
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
                  placeholder="company@example.com"
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
                  placeholder="+1 (555) 123-4567"
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
                  placeholder="GSTIN123456789"
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
                  placeholder="REG123456789"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium mb-2 text-gray-300">
                  City
                </label>
                <input
                  type="text"
                  name="city"
                  value={formData.city || ""}
                  onChange={handleInputChange}
                  className="w-full p-2 rounded-md bg-[#1C1C1D] border border-gray-600 text-gray-300"
                  disabled={isLoading}
                  placeholder="City"
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-2 text-gray-300">
                  State
                </label>
                <input
                  type="text"
                  name="state"
                  value={formData.state || ""}
                  onChange={handleInputChange}
                  className="w-full p-2 rounded-md bg-[#1C1C1D] border border-gray-600 text-gray-300"
                  disabled={isLoading}
                  placeholder="State/Province"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium mb-2 text-gray-300">
                  Postal Code
                </label>
                <input
                  type="text"
                  name="pin_code"
                  value={formData.pin_code || ""}
                  onChange={handleInputChange}
                  className="w-full p-2 rounded-md bg-[#1C1C1D] border border-gray-600 text-gray-300"
                  disabled={isLoading}
                  placeholder="Postal/Zip code"
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-2 text-gray-300">
                  Country
                </label>
                <input
                  type="text"
                  name="country"
                  value={formData.country || ""}
                  onChange={handleInputChange}
                  className="w-full p-2 rounded-md bg-[#1C1C1D] border border-gray-600 text-gray-300"
                  disabled={isLoading}
                  placeholder="Country"
                />
              </div>
            </div>

            <div className="flex items-center mt-4">
              <input
                type="checkbox"
                id="is_own_company"
                name="is_own_company"
                checked={formData.is_own_company}
                onChange={handleInputChange}
                className="h-4 w-4 rounded border-gray-600 bg-[#1C1C1D] text-blue-600 focus:ring-blue-500"
                disabled={isLoading}
              />
              <label
                htmlFor="is_own_company"
                className="ml-2 text-sm text-gray-300"
              >
                This is our own company
              </label>
            </div>
          </div>
        </div>

        <div className="mt-8 flex justify-end">
          <button
            type="submit"
            className="bg-blue-600 hover:bg-blue-700 text-white py-2 px-6 rounded-md"
            disabled={isLoading}
          >
            {isLoading ? "Creating..." : "Create Company"}
          </button>
        </div>
      </form>
    </div>
  );
}
