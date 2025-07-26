'use client';

import { useState, useEffect } from 'react';
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
);

export default function AdminDashboard() {
  const [registrations, setRegistrations] = useState([]);
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState({});
  const [searchTerm, setSearchTerm] = useState('');
  const [filterRegion, setFilterRegion] = useState('');

  useEffect(() => {
    fetchRegistrations();
    fetchStats();
  }, []);

  const fetchRegistrations = async () => {
    try {
      const { data, error } = await supabase
        .from('nryli_registrations')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;
      setRegistrations(data || []);
    } catch (error) {
      console.error('Error fetching registrations:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchStats = async () => {
    try {
      // Get total count
      const { count: totalCount } = await supabase
        .from('nryli_registrations')
        .select('*', { count: 'exact', head: true });

      // Get count by region
      const { data: regionData } = await supabase
        .from('nryli_registrations')
        .select('region_cluster')
        .then(result => {
          const regionCounts = {};
          result.data?.forEach(item => {
            regionCounts[item.region_cluster] = (regionCounts[item.region_cluster] || 0) + 1;
          });
          return { data: regionCounts };
        });

      // Get count by delegate type
      const { data: delegateData } = await supabase
        .from('nryli_registrations')
        .select('delegate_type')
        .then(result => {
          const delegateCounts = {};
          result.data?.forEach(item => {
            delegateCounts[item.delegate_type] = (delegateCounts[item.delegate_type] || 0) + 1;
          });
          return { data: delegateCounts };
        });

      setStats({
        total: totalCount || 0,
        byRegion: regionData || {},
        byDelegateType: delegateData || {}
      });
    } catch (error) {
      console.error('Error fetching stats:', error);
    }
  };

  const updateRegistrationStatus = async (id, newStatus) => {
    try {
      const { error } = await supabase
        .from('nryli_registrations')
        .update({ status: newStatus })
        .eq('id', id);

      if (error) throw error;
      
      // Refresh data
      fetchRegistrations();
      fetchStats();
    } catch (error) {
      console.error('Error updating status:', error);
      alert('Error updating status');
    }
  };

  const exportToCSV = () => {
    const headers = [
      'Registration ID', 'Date', 'Name', 'Delegate Type', 'Institution', 
      'Region', 'Contact', 'Email', 'Age', 'T-shirt Size', 'Status'
    ];
    
    const csvData = registrations.map(reg => [
      reg.registration_id,
      new Date(reg.created_at).toLocaleDateString(),
      `${reg.surname}, ${reg.first_name}`,
      reg.delegate_type,
      reg.institution,
      reg.region_cluster,
      reg.delegate_contact,
      reg.delegate_email,
      reg.age,
      reg.tshirt_size,
      reg.status
    ]);

    const csvContent = [headers, ...csvData]
      .map(row => row.map(field => `"${field}"`).join(','))
      .join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `nryli_registrations_${new Date().toISOString().split('T')[0]}.csv`;
    a.click();
  };

  const filteredRegistrations = registrations.filter(reg => {
    const matchesSearch = searchTerm === '' || 
      reg.registration_id.toLowerCase().includes(searchTerm.toLowerCase()) ||
      `${reg.first_name} ${reg.surname}`.toLowerCase().includes(searchTerm.toLowerCase()) ||
      reg.institution.toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesRegion = filterRegion === '' || reg.region_cluster === filterRegion;
    
    return matchesSearch && matchesRegion;
  });

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-100 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading registrations...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-100 p-6">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="bg-white rounded-lg shadow-md p-6 mb-6">
          <h1 className="text-3xl font-bold text-gray-800 mb-2">NRYLI Registration Dashboard</h1>
          <p className="text-gray-600">Manage and monitor registration submissions</p>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
          <div className="bg-blue-500 text-white p-6 rounded-lg">
            <h3 className="text-lg font-semibold">Total Registrations</h3>
            <p className="text-3xl font-bold">{stats.total}</p>
          </div>
          <div className="bg-green-500 text-white p-6 rounded-lg">
            <h3 className="text-lg font-semibold">NCR</h3>
            <p className="text-3xl font-bold">{stats.byRegion?.NCR || 0}</p>
          </div>
          <div className="bg-purple-500 text-white p-6 rounded-lg">
            <h3 className="text-lg font-semibold">Luzon</h3>
            <p className="text-3xl font-bold">{stats.byRegion?.Luzon || 0}</p>
          </div>
          <div className="bg-orange-500 text-white p-6 rounded-lg">
            <h3 className="text-lg font-semibold">Visayas/Mindanao</h3>
            <p className="text-3xl font-bold">{(stats.byRegion?.Visayas || 0) + (stats.byRegion?.Mindanao || 0)}</p>
          </div>
        </div>

        {/* Filters and Actions */}
        <div className="bg-white rounded-lg shadow-md p-6 mb-6">
          <div className="flex flex-col md:flex-row gap-4 items-center justify-between">
            <div className="flex flex-col md:flex-row gap-4 flex-1">
              <input
                type="text"
                placeholder="Search by name, registration ID, or institution..."
                className="flex-1 p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
              <select
                className="p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                value={filterRegion}
                onChange={(e) => setFilterRegion(e.target.value)}
              >
                <option value="">All Regions</option>
                <option value="NCR">NCR</option>
                <option value="Luzon">Luzon</option>
                <option value="Visayas">Visayas</option>
                <option value="Mindanao">Mindanao</option>
              </select>
            </div>
            <button
              onClick={exportToCSV}
              className="bg-green-600 hover:bg-green-700 text-white px-6 py-3 rounded-lg font-semibold transition-colors"
            >
              Export CSV
            </button>
          </div>
        </div>

        {/* Registrations Table */}
        <div className="bg-white rounded-lg shadow-md overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Registration</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Delegate</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Institution</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Contact</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Details</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {filteredRegistrations.map((registration) => (
                  <tr key={registration.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm font-medium text-gray-900">{registration.registration_id}</div>
                      <div className="text-sm text-gray-500">{new Date(registration.created_at).toLocaleDateString()}</div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm font-medium text-gray-900">
                        {registration.surname}, {registration.first_name}
                      </div>
                      <div className="text-sm text-gray-500">{registration.delegate_type}</div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="text-sm text-gray-900">{registration.institution}</div>
                      <div className="text-sm text-gray-500">{registration.region_cluster}</div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-gray-900">{registration.delegate_contact}</div>
                      <div className="text-sm text-gray-500">{registration.delegate_email}</div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-gray-900">Age: {registration.age}</div>
                      <div className="text-sm text-gray-500">Size: {registration.tshirt_size}</div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                        registration.status === 'approved' ? 'bg-green-100 text-green-800' :
                        registration.status === 'rejected' ? 'bg-red-100 text-red-800' :
                        'bg-yellow-100 text-yellow-800'
                      }`}>
                        {registration.status}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                      <select
                        value={registration.status}
                        onChange={(e) => updateRegistrationStatus(registration.id, e.target.value)}
                        className="text-sm border border-gray-300 rounded px-2 py-1"
                      >
                        <option value="pending">Pending</option>
                        <option value="approved">Approved</option>
                        <option value="rejected">Rejected</option>
                      </select>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          
          {filteredRegistrations.length === 0 && (
            <div className="text-center py-12">
              <p className="text-gray-500">No registrations found matching your criteria.</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}