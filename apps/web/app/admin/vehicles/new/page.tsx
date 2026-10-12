'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';

export default function AdminAddVehiclePage() {
  const router = useRouter();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [formData, setFormData] = useState({
    make: '',
    model: '',
    variant: '',
    year: '',
    price: '',
    mileage: '',
    fuelType: '',
    transmission: '',
    drivetrain: '',
    bodyStyle: '',
    exteriorColor: '',
    interiorColor: '',
    description: '',
    status: 'draft',
    featured: false,
  });

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>
  ) => {
    const { name, value, type } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: type === 'checkbox' ? (e.target as HTMLInputElement).checked : value,
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    // TODO: API call to create vehicle
    await new Promise((resolve) => setTimeout(resolve, 1000));
    router.push('/admin/vehicles');
  };

  return (
    <div className="max-w-4xl mx-auto">
      <div className="mb-8">
        <h1 className="text-heading-md font-semibold text-primary-text mb-1">
          Add New Vehicle
        </h1>
        <p className="text-body-sm text-primary-muted">
          Fill in the details below to create a new vehicle listing
        </p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-8">
        {/* Basic Information */}
        <div className="bg-white rounded-xl border border-gray-200 p-6">
          <h2 className="text-heading-sm font-semibold text-primary-text mb-6">
            Basic Information
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
            <div>
              <label className="block text-body-sm font-medium text-primary-text mb-2">
                Make *
              </label>
              <input
                type="text"
                name="make"
                value={formData.make}
                onChange={handleChange}
                required
                className="w-full px-4 py-2.5 rounded-lg border border-gray-200 text-body-sm focus:outline-none focus:ring-2 focus:ring-primary-accent focus:border-transparent"
                placeholder="e.g. BMW"
              />
            </div>
            <div>
              <label className="block text-body-sm font-medium text-primary-text mb-2">
                Model *
              </label>
              <input
                type="text"
                name="model"
                value={formData.model}
                onChange={handleChange}
                required
                className="w-full px-4 py-2.5 rounded-lg border border-gray-200 text-body-sm focus:outline-none focus:ring-2 focus:ring-primary-accent focus:border-transparent"
                placeholder="e.g. M4 Competition"
              />
            </div>
            <div>
              <label className="block text-body-sm font-medium text-primary-text mb-2">
                Variant / Trim
              </label>
              <input
                type="text"
                name="variant"
                value={formData.variant}
                onChange={handleChange}
                className="w-full px-4 py-2.5 rounded-lg border border-gray-200 text-body-sm focus:outline-none focus:ring-2 focus:ring-primary-accent focus:border-transparent"
                placeholder="e.g. xDrive"
              />
            </div>
            <div>
              <label className="block text-body-sm font-medium text-primary-text mb-2">
                Year *
              </label>
              <input
                type="number"
                name="year"
                value={formData.year}
                onChange={handleChange}
                required
                className="w-full px-4 py-2.5 rounded-lg border border-gray-200 text-body-sm focus:outline-none focus:ring-2 focus:ring-primary-accent focus:border-transparent"
                placeholder="2024"
              />
            </div>
            <div>
              <label className="block text-body-sm font-medium text-primary-text mb-2">
                Body Style
              </label>
              <select
                name="bodyStyle"
                value={formData.bodyStyle}
                onChange={handleChange}
                className="w-full px-4 py-2.5 rounded-lg border border-gray-200 text-body-sm focus:outline-none focus:ring-2 focus:ring-primary-accent focus:border-transparent bg-white"
              >
                <option value="">Select body style</option>
                <option value="sedan">Sedan</option>
                <option value="suv">SUV</option>
                <option value="coupe">Coupe</option>
                <option value="convertible">Convertible</option>
                <option value="hatchback">Hatchback</option>
                <option value="wagon">Wagon</option>
                <option value="truck">Truck</option>
              </select>
            </div>
            <div>
              <label className="block text-body-sm font-medium text-primary-text mb-2">
                Condition
              </label>
              <select
                name="condition"
                className="w-full px-4 py-2.5 rounded-lg border border-gray-200 text-body-sm focus:outline-none focus:ring-2 focus:ring-primary-accent focus:border-transparent bg-white"
              >
                <option value="new">New</option>
                <option value="used">Used</option>
                <option value="certified">Certified Pre-Owned</option>
              </select>
            </div>
          </div>
        </div>

        {/* Pricing & Specifications */}
        <div className="bg-white rounded-xl border border-gray-200 p-6">
          <h2 className="text-heading-sm font-semibold text-primary-text mb-6">
            Pricing & Specifications
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
            <div>
              <label className="block text-body-sm font-medium text-primary-text mb-2">
                Price (USD) *
              </label>
              <input
                type="number"
                name="price"
                value={formData.price}
                onChange={handleChange}
                required
                className="w-full px-4 py-2.5 rounded-lg border border-gray-200 text-body-sm focus:outline-none focus:ring-2 focus:ring-primary-accent focus:border-transparent"
                placeholder="75000"
              />
            </div>
            <div>
              <label className="block text-body-sm font-medium text-primary-text mb-2">
                Mileage
              </label>
              <input
                type="number"
                name="mileage"
                value={formData.mileage}
                onChange={handleChange}
                className="w-full px-4 py-2.5 rounded-lg border border-gray-200 text-body-sm focus:outline-none focus:ring-2 focus:ring-primary-accent focus:border-transparent"
                placeholder="0"
              />
            </div>
            <div>
              <label className="block text-body-sm font-medium text-primary-text mb-2">
                Fuel Type
              </label>
              <select
                name="fuelType"
                value={formData.fuelType}
                onChange={handleChange}
                className="w-full px-4 py-2.5 rounded-lg border border-gray-200 text-body-sm focus:outline-none focus:ring-2 focus:ring-primary-accent focus:border-transparent bg-white"
              >
                <option value="">Select fuel type</option>
                <option value="gasoline">Gasoline</option>
                <option value="diesel">Diesel</option>
                <option value="electric">Electric</option>
                <option value="hybrid">Hybrid</option>
                <option value="plugin-hybrid">Plug-in Hybrid</option>
              </select>
            </div>
            <div>
              <label className="block text-body-sm font-medium text-primary-text mb-2">
                Transmission
              </label>
              <select
                name="transmission"
                value={formData.transmission}
                onChange={handleChange}
                className="w-full px-4 py-2.5 rounded-lg border border-gray-200 text-body-sm focus:outline-none focus:ring-2 focus:ring-primary-accent focus:border-transparent bg-white"
              >
                <option value="">Select transmission</option>
                <option value="automatic">Automatic</option>
                <option value="manual">Manual</option>
                <option value="cvt">CVT</option>
              </select>
            </div>
            <div>
              <label className="block text-body-sm font-medium text-primary-text mb-2">
                Drivetrain
              </label>
              <select
                name="drivetrain"
                value={formData.drivetrain}
                onChange={handleChange}
                className="w-full px-4 py-2.5 rounded-lg border border-gray-200 text-body-sm focus:outline-none focus:ring-2 focus:ring-primary-accent focus:border-transparent bg-white"
              >
                <option value="">Select drivetrain</option>
                <option value="fwd">FWD</option>
                <option value="rwd">RWD</option>
                <option value="awd">AWD</option>
                <option value="4wd">4WD</option>
              </select>
            </div>
            <div>
              <label className="block text-body-sm font-medium text-primary-text mb-2">
                Exterior Color
              </label>
              <input
                type="text"
                name="exteriorColor"
                value={formData.exteriorColor}
                onChange={handleChange}
                className="w-full px-4 py-2.5 rounded-lg border border-gray-200 text-body-sm focus:outline-none focus:ring-2 focus:ring-primary-accent focus:border-transparent"
                placeholder="e.g. Alpine White"
              />
            </div>
          </div>
        </div>

        {/* Description */}
        <div className="bg-white rounded-xl border border-gray-200 p-6">
          <h2 className="text-heading-sm font-semibold text-primary-text mb-6">
            Description
          </h2>
          <textarea
            name="description"
            value={formData.description}
            onChange={handleChange}
            rows={5}
            className="w-full px-4 py-3 rounded-lg border border-gray-200 text-body-sm focus:outline-none focus:ring-2 focus:ring-primary-accent focus:border-transparent resize-none"
            placeholder="Write a compelling description of the vehicle..."
          />
        </div>

        {/* Publishing */}
        <div className="bg-white rounded-xl border border-gray-200 p-6">
          <h2 className="text-heading-sm font-semibold text-primary-text mb-6">
            Publishing
          </h2>
          <div className="space-y-4">
            <label className="flex items-center gap-3 cursor-pointer">
              <input
                type="checkbox"
                name="featured"
                checked={formData.featured}
                onChange={handleChange}
                className="w-4 h-4 rounded border-gray-300 text-primary-accent focus:ring-2 focus:ring-primary-accent"
              />
              <span className="text-body-sm text-primary-text">
                Mark as featured vehicle
              </span>
            </label>
            <div>
              <label className="block text-body-sm font-medium text-primary-text mb-2">
                Status
              </label>
              <select
                name="status"
                value={formData.status}
                onChange={handleChange}
                className="px-4 py-2.5 rounded-lg border border-gray-200 text-body-sm focus:outline-none focus:ring-2 focus:ring-primary-accent focus:border-transparent bg-white"
              >
                <option value="draft">Draft</option>
                <option value="published">Published</option>
              </select>
            </div>
          </div>
        </div>

        {/* Actions */}
        <div className="flex items-center justify-end gap-3">
          <button
            type="button"
            onClick={() => router.back()}
            className="btn-secondary"
          >
            Cancel
          </button>
          <button
            type="submit"
            disabled={isSubmitting}
            className="btn-primary disabled:opacity-50"
          >
            {isSubmitting ? 'Saving...' : 'Save Vehicle'}
          </button>
        </div>
      </form>
    </div>
  );
}
